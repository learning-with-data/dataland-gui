import {
  AIService,
  getUsage,
  getSessionUsage,
  commitSessionUsage,
  resetUsage,
} from "./AIService";
import { ToolRegistry } from "./ToolRegistry";

/**
 * Maximum number of model round-trips for a single user turn, configurable
 * via the VITE_AI_MAX_TURNS env variable. Must be a positive integer; any
 * other value (unset, empty, non-numeric, fractional, or below 1) falls
 * back to 5.
 */
const MAX_TURNS = (() => {
  const parsed = Number(import.meta.env.VITE_AI_MAX_TURNS);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 5;
})();

// Token usage is only tracked and logged in development builds (the dev
// server, i.e. `npm start`); the accounting and console output are skipped
// entirely in production builds and the unit-test environment.
const USAGE_LOGGING_ENABLED = import.meta.env.DEV;

/**
 * Runs the AI agent: a loop of model calls in which the model can request
 * tool calls that are executed locally against the project (via the
 * ToolRegistry) and whose results are fed back to the model.
 *
 * The loop terminates when the model produces a final text answer (no
 * pending tool calls), when the maximum number of turns is reached, or on
 * error. All UI updates are reported through the provided callbacks, so this
 * class is deliberately UI-agnostic.
 */
export class AIAgent {
  /**
   * Maximum number of model round-trips for a single user turn (see the
   * module-level `MAX_TURNS` above, configurable via VITE_AI_MAX_TURNS).
   * Guards against tool-calling loops.
   */
  static MAX_TURNS = MAX_TURNS;

  /**
   * Maximum number of project mutations (addDataColumn, createVariable,
   * insertCode) allowed per user turn. Each requires a separate user
   * confirmation, so this caps how many confirmations a single request can
   * trigger.
   */
  static MAX_MUTATIONS_PER_TURN = 3;

  /**
   * Runs the agent for one user turn.
   *
   * @param {Object} options
   * @param {Array} options.messages - The initial message list: the system
   *   prompt, the prior chat history, and the new user message.
   * @param {Object} options.toolContext - `{ runtime, editor, microworld }`.
   * @param {Function} [options.onContentChunk] - Called with each content
   *   delta of the latest model response.
   * @param {Function} [options.onReasoningChunk] - Called with each
   *   reasoning delta.
   * @param {Function} [options.onToolEvent] - Called with a tool event object
   *   when a tool call starts and again when it finishes. Events carry
   *   `{ id, name, args, status, result }` where status is "started",
   *   "pending_confirmation", or "done". Mutating tools additionally set
   *   `description` (a human-readable summary for the confirmation card) and
   *   `error` (set when validation or execution failed).
   * @param {Function} [options.onTurn] - Called at the start of each model
   *   turn with the turn number (1-based).
   * @param {Function} [options.onComplete] - Called when the turn finishes
   *   normally. Receives `{ message, toolEvents }` where `message` is the
   *   final assistant message (for history storage) and `toolEvents` is the
   *   full ordered list of tool events for this turn.
   * @param {Function} [options.onError] - Called when the turn fails.
   */
  static async run({
    messages,
    toolContext,
    onContentChunk,
    onReasoningChunk,
    onToolEvent,
    onTurn,
    onComplete,
    onError,
    isCancelled,
    onConfirmationTimeout,
  }) {
    const allMessages = [...messages];
    const toolEvents = [];

    // Start a fresh token-usage accounting for this turn (the accumulator
    // in AIService is shared across turns; the developer-facing log below
    // reports it once the turn finishes). Tracking is dev-only; in other
    // builds `logUsage` is a no-op and the API is not asked for usage.
    if (USAGE_LOGGING_ENABLED) {
      resetUsage();
    }

    const logUsage = (label) => {
      if (!USAGE_LOGGING_ENABLED) return;
      // Fold this turn's usage into the session total before logging, so the
      // log line shows both the per-turn figure and the running session total.
      commitSessionUsage();
      const u = getUsage();
      const s = getSessionUsage();
      console.log(
        `[AI tokens] ${label} ` +
          `turn: prompt ${u ? u.prompt_tokens : "?"}, ` +
          `completion ${u ? u.completion_tokens : "?"}, ` +
          `total ${u ? u.total_tokens : "?"}; ` +
          `session: prompt ${s ? s.prompt_tokens : "?"}, ` +
          `completion ${s ? s.completion_tokens : "?"}, ` +
          `total ${s ? s.total_tokens : "?"} tokens`
      );
    };

    const finish = (message) => {
      logUsage("turn finished");
      if (onComplete) {
        onComplete({
          message,
          toolEvents,
        });
      }
    };

    const fail = (error) => {
      logUsage("turn failed");
      if (onError) onError(error);
    };

    for (let turn = 1; turn <= AIAgent.MAX_TURNS; turn++) {
      if (onTurn) onTurn(turn);

      let content = "";
      let reasoning = "";
      let failed = false;
      const turnToolCalls = [];
      const turnReasoning = [];

      await AIService.streamChat(
        allMessages,
        (chunk) => {
          content += chunk;
          if (onContentChunk) onContentChunk(chunk);
        },
        (reasoningChunk) => {
          reasoning += reasoningChunk;
          turnReasoning.push(reasoningChunk);
          if (onReasoningChunk) onReasoningChunk(reasoningChunk);
        },
        () => {
          // The stream for this turn has ended.
        },
        (error) => {
          failed = true;
          fail(error);
        },
        ToolRegistry.toOpenAITools(),
        (toolCall) => {
          turnToolCalls.push(toolCall);
        }
      );

      if (failed) return;

      // No tool calls requested: this is the final answer.
      if (turnToolCalls.length === 0) {
        finish({ role: "assistant", content, reasoning });
        return;
      }

      // The model asked for tool(s). Record the assistant message that
      // carries the tool_calls (with the reasoning that produced them, so
      // the chat history shows why the tools were called), execute each
      // call, and append one `tool` result message per call so the next
      // turn can use the results.
      const turnReasoningText = turnReasoning.join("");
      allMessages.push({
        role: "assistant",
        content: content || null,
        reasoning: turnReasoningText || undefined,
        tool_calls: turnToolCalls,
      });

      // Execute each tool call and append a `tool` result message for every
      // one (the API requires a tool result for each tool_call, even when the
      // call failed validation), so the next turn can use the results.
      for (const toolCall of turnToolCalls) {
        const outcome = await AIAgent._executeToolCall(
          toolCall,
          toolContext,
          toolEvents,
          onToolEvent,
          isCancelled
        );

        // The turn was cancelled (e.g. the user cleared the history) while
        // waiting for confirmation. Stop the agent here and let the UI
        // consumer clean up (clear events, end typing).
        if (outcome.cancelled) {
          logUsage("turn cancelled");
          if (onConfirmationTimeout) onConfirmationTimeout();
          return;
        }

        allMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: outcome.result,
        });
      }
    }

    // Max turns exhausted: surface a message so the user is not left with a
    // silent failure. Include a short summary of the steps that *were*
    // completed so the user knows what already happened (e.g. a column was
    // already added) and can continue in a follow-up message.
    finish({
      role: "assistant",
      content: AIAgent._maxTurnsMessage(toolEvents),
      reasoning: "",
      max_turns: true,
    });
  }

  /**
   * Builds the fallback message shown when the turn is cut off at
   * MAX_TURNS: a generic explanation, a summary of the steps that did
   * complete, and an invitation to continue in a follow-up message.
   * @param {Array} toolEvents The tool events completed this turn.
   * @returns {string}
   */
  static _maxTurnsMessage(toolEvents) {
    const intro =
      "I reached the maximum number of steps for one request, so I stopped " +
      "before finishing your full request. Here is what I completed:";
    const lines = [];
    let count = 0;
    for (const event of toolEvents) {
      if (!event || event.status !== "done" || count >= 5) continue;
      const what =
        event.description ||
        ToolRegistry.describeToolCall(event.name, event.args || {});
      const mark = event.error || event.confirmed === false ? "✗" : "✓";
      lines.push(`- ${mark} ${what}`);
      count += 1;
    }
    if (lines.length) {
      return intro + "\n" + lines.join("\n");
    }
    return (
      "I reached the maximum number of steps for one request without " +
      "finishing. Please try rephrasing the request."
    );
  }

  /**
   * Executes one tool call from the model and records the corresponding
   * tool event(s) in the shared event list.
   *
   * Read-only tools run immediately. Mutating tools are first validated
   * (invalid calls are reported straight back to the model), then paused
   * until the user confirms them through the UI (the confirmation promise is
   * supplied by the `onToolEvent` consumer). An allowed call runs and its
   * result is reported; a denied call reports a fixed decline message so the
   * model does not retry.
   *
   * @param {Object} toolCall - `{ id, function: { name, arguments } }`.
   * @param {Object} toolContext - The tool context.
   * @param {Array} toolEvents - The shared, ordered list of tool events.
   * @param {Function} [onToolEvent] - UI callback for event updates. For
   *   mutating tools it must return a promise that resolves with `{ allowed: boolean }`
   *   once the user has answered the confirmation card.
   * @param {Function} [isCancelled] - Returns true when the turn was
   *   cancelled externally (e.g. history cleared); checked while waiting for
   *   confirmation.
   * @returns {Promise<{cancelled: boolean, result: string}>}
   */
  static async _executeToolCall(
    toolCall,
    toolContext,
    toolEvents,
    onToolEvent,
    isCancelled
  ) {
    const name = toolCall.function.name;
    let args;
    try {
      args = toolCall.function.arguments
        ? JSON.parse(toolCall.function.arguments)
        : {};
    } catch {
      // Invalid arguments: remember the raw string and report an error back
      // to the model below so it can retry with valid JSON.
      args = { raw: toolCall.function.arguments };
    }

    const tool = ToolRegistry.getTool(name);
    const event = {
      id: toolCall.id,
      name,
      args,
      status: "started",
      result: null,
    };
    toolEvents.push(event);

    // Report the event and, for mutating tools, ask the UI consumer for a
    // confirmation promise. All event emissions go through `emit` so that the
    // promise returned by a "pending_confirmation" event is always captured,
    // regardless of which emission triggered it.
    //
    // The consumer is expected to update the event *in place* in its own
    // records (not by copying it) so that later mutations of `event` (e.g.
    // the confirmation outcome) remain visible through the emitted record.
    let confirmationPromise = null;
    const emit = (ev) => {
      if (onToolEvent) confirmationPromise = onToolEvent(ev);
    };
    emit(event);

    let result;
    if (args && Object.prototype.hasOwnProperty.call(args, "raw")) {
      result = JSON.stringify({
        error:
          "The arguments for this tool call were not valid JSON. " +
          "Please call the tool again with valid JSON arguments.",
      });
      event.status = "done";
      event.result = result;
      emit(event);
    } else if (tool && tool.mutating) {
      // Validate before asking the user, so they are never prompted to
      // approve an action that would fail.
      const validation = ToolRegistry.validateTool(name, args, toolContext);
      if (!validation.ok) {
        result = JSON.stringify({ error: validation.error });
        event.status = "done";
        event.result = result;
        event.error = validation.error;
        emit(event);
      } else {
        if (AIAgent._successfulMutationCount(toolEvents) >= AIAgent.MAX_MUTATIONS_PER_TURN) {
          result = JSON.stringify({
            error:
              "The maximum number of project modifications per request has " +
              "been reached. Ask the user to make the remaining changes in " +
              "a new message.",
          });
          event.status = "done";
          event.result = result;
          event.error = "mutation cap reached";
          emit(event);
        } else {
          // Pause the loop until the user answers the confirmation card.
          const description = ToolRegistry.describeToolCall(name, args);
          event.status = "pending_confirmation";
          event.description = description;
          emit(event);

          const decision = await AIAgent._awaitConfirmation(
            confirmationPromise,
            isCancelled
          );

          if (decision.cancelled) {
            return { cancelled: true, result: "" };
          }

          if (decision.allowed) {
            const outcome = await ToolRegistry.executeTool(
              name,
              args,
              toolContext
            );
            result = outcome.result;
            if (!outcome.ok) {
              event.error =
                "Execution failed: " +
                (function () {
                  try {
                    return JSON.parse(result).error;
                  } catch {
                    return "the tool failed while running";
                  }
                })();
            }
          } else {
            result =
              "The user declined this action. Do not retry it. Ask the " +
              "user how they would like to proceed instead.";
          }

          event.status = "done";
          event.result = result;
          event.confirmed = decision.allowed;
          emit(event);
        }
      }
    } else {
      const outcome = await ToolRegistry.executeTool(name, args, toolContext);
      result = outcome.result;
      if (!outcome.ok) {
        event.error =
          "Execution failed: " +
          (function () {
            try {
              return JSON.parse(result).error;
            } catch {
              return "the tool failed while running";
            }
          })();
      }

      event.status = "done";
      event.result = result;
      emit(event);
    }

    return { cancelled: false, result };
  }

  /**
   * Counts how many mutating tool calls completed successfully so far in
   * this turn's event list (used to enforce MAX_MUTATIONS_PER_TURN).
   * @param {Array} toolEvents The shared tool event list.
   * @returns {number}
   */
  static _successfulMutationCount(toolEvents) {
    let count = 0;
    for (const event of toolEvents) {
      const tool = ToolRegistry.getTool(event.name);
      if (!tool || !tool.mutating || event.status !== "done" || event.result === null) {
        continue;
      }
      try {
        const parsed = JSON.parse(event.result);
        if (parsed && parsed.success) count += 1;
      } catch {
        // Not JSON (e.g. a decline message); not a successful mutation.
      }
    }
    return count;
  }

  /**
   * Awaits the user's confirmation decision, racing against external
   * cancellation of the turn.
   *
   * @param {Promise<{allowed: boolean}>|undefined} confirmationPromise - The
   *   promise returned by `onToolEvent` when the status was
   *   "pending_confirmation".
   * @param {Function} [isCancelled] - Returns true when the turn was
   *   cancelled externally.
   * @returns {Promise<{allowed: boolean, cancelled: boolean}>}
   */
  static async _awaitConfirmation(confirmationPromise, isCancelled) {
    if (!confirmationPromise) {
      // No UI to confirm with (should not happen in the app): deny.
      return { allowed: false, cancelled: false };
    }
    const decisionPromise = Promise.resolve(confirmationPromise).then(
      (decision) => ({ allowed: Boolean(decision && decision.allowed), cancelled: false }),
      () => ({ allowed: false, cancelled: false })
    );
    if (!isCancelled) {
      return decisionPromise;
    }
    let timer = null;
    const cancellation = new Promise((resolve) => {
      const check = () => {
        if (isCancelled()) {
          if (timer) clearInterval(timer);
          resolve({ allowed: false, cancelled: true });
        }
      };
      timer = setInterval(check, 50);
      check();
    });
    // Always clear the polling interval once the decision is known, so it
    // cannot keep firing after the race settles.
    decisionPromise.then(() => {
      if (timer) clearInterval(timer);
    });
    return Promise.race([decisionPromise, cancellation]);
  }

  /**
   * Requests permission to load the given Blockly blocks into the editor,
   * using the same confirmation flow as a model-initiated `insertCode` tool
   * call (validation, Allow/Deny card, execution). This is the mechanism by
   * which the UI asks the user to approve blocks the assistant returned in
   * its final answer: there is no direct "insert" path — every code
   * insertion goes through the Allow/Deny card.
   *
   * @param {Object} options
   * @param {Object} options.code - The parsed Blockly workspace JSON object
   *   (as returned by {@link isBlocksJson}) to load into the editor.
   * @param {Object} options.toolContext - `{ runtime, editor, microworld }`.
   * @param {Function} options.onToolEvent - Called with the tool event as its
   *   status changes ("started", "pending_confirmation", "done"). For the
   *   "pending_confirmation" emission it must return the promise that
   *   resolves with `{ allowed }` once the user answers the confirmation
   *   card, exactly like the agent loop's `onToolEvent`.
   * @param {Function} [options.isCancelled] - Returns true when the request
   *   was cancelled externally (e.g. the history was cleared) while waiting
   *   for the decision.
   * @returns {Promise<{event: Object, cancelled: boolean}>} Resolves with
   *   the final tool event (status "done") and whether it was cancelled.
   */
  static async requestInsertCode({ code, toolContext, onToolEvent, isCancelled }) {
    const toolCall = {
      id: `insert_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      type: "function",
      function: {
        name: "insertCode",
        arguments: JSON.stringify({ code }),
      },
    };
    const toolEvents = [];
    const outcome = await AIAgent._executeToolCall(
      toolCall,
      toolContext,
      toolEvents,
      onToolEvent,
      isCancelled
    );
    return { event: toolEvents[0], cancelled: outcome.cancelled };
  }
}
