import { AI_CONFIG } from "../../config";

/**
 * True when the build was configured with vision support. When vision is on,
 * every assistant and tool message is sent as a content-part array (which is
 * the only shape that can carry image parts), so a returned chart image
 * stays in the conversation for the rest of the turn.
 */
const VISION_ENABLED = import.meta.env.VITE_AI_VISION === "true";

// Token usage is only tracked and reported in development builds (the dev
// server, i.e. `npm start`); in production builds and the unit-test
// environment the API is not even asked to include usage (see AIAgent, which
// logs the accumulator once per turn).
const USAGE_LOGGING_ENABLED = import.meta.env.DEV;

/**
 * Token usage accumulated across the model calls of the current agent turn.
 * The agent resets it at the start of each turn (see AIAgent.run) and logs
 * it when the turn finishes. `prompt_tokens` is summed across calls (each
 * call re-sends the growing conversation); `completion_tokens` is kept as
 * the last non-null value reported, which is the running total the provider
 * reports over the whole (multi-call) turn. A null value means the provider
 * did not report usage for the call (e.g. `stream_options` unsupported).
 */
let usage = null;

/**
 * Token usage accumulated across the whole session (all turns since the
 * last reset). Each turn's reported usage is folded in when the turn ends
 * (see AIAgent.run), so this is a strict sum of the per-turn figures. It is
 * zeroed on a reset (i.e. when the user clears the history), so a "session"
 * is everything between two clears. A null value means no usage has been
 * reported yet.
 */
let sessionUsage = null;

/**
 * Returns the accumulated token usage for the current agent turn
 * (`{ prompt_tokens, completion_tokens, total_tokens }`), or null when the
 * provider has not reported usage yet.
 * @returns {?{prompt_tokens: number, completion_tokens: number, total_tokens: number}}
 */
export const getUsage = () => usage;

/**
 * Returns the accumulated token usage for the whole session, or null when no
 * usage has been reported yet.
 * @returns {?{prompt_tokens: number, completion_tokens: number, total_tokens: number}}
 */
export const getSessionUsage = () => sessionUsage;

/**
 * Folds the current turn's reported usage into the session total (called
 * once per finished turn, see AIAgent.run). A turn that produced no usage
 * leaves the session total unchanged.
 */
export const commitSessionUsage = () => {
  if (!usage) return;
  sessionUsage = {
    prompt_tokens:
      (sessionUsage && sessionUsage.prompt_tokens) + usage.prompt_tokens,
    completion_tokens:
      (sessionUsage && sessionUsage.completion_tokens) + usage.completion_tokens,
  };
  sessionUsage.total_tokens =
    sessionUsage.prompt_tokens + sessionUsage.completion_tokens;
};

/**
 * Resets the accumulated token usage (call at the start of each agent turn)
 * and, when `resetSession` is true, the session total as well (call when the
 * user clears the history, which starts a new session).
 */
export const resetUsage = (resetSession = false) => {
  usage = null;
  if (resetSession) {
    sessionUsage = null;
  }
};

/**
 * Rewrites the message list into the vision-capable shape: assistant and
 * tool messages become content-part arrays (`[{ type: "text", text }]`),
 * and tool results that carry an image become a text part plus an
 * `image_url` part. The original list is not mutated.
 * @param {Array} messages
 * @returns {Array}
 */
const toVisionMessages = (messages) =>
  messages.map((message) => {
    if (message.role === "assistant") {
      const text =
        typeof message.content === "string" ? message.content : "";
      return { role: "assistant", content: [{ type: "text", text }] };
    }
    if (message.role === "tool") {
      const text = typeof message.content === "string" ? message.content : "";
      const parts = [{ type: "text", text }];
      let imageUrl = null;
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.image === "string" && parsed.image.startsWith("data:image/")) {
          imageUrl = parsed.image;
        }
      } catch {
        // Not JSON; the text part alone is enough.
      }
      if (imageUrl) {
        parts.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      return { role: "tool", tool_call_id: message.tool_call_id, content: parts };
    }
    return message;
  });

export class AIService {
  /**
   * Streams a response from the AI API.
   * @param {Array} messages - Array of message objects { role, content }.
   * @param {Array} [tools] - Optional array of tool definitions in the
   *   OpenAI tools format (as produced by
   *   {@link module:services/ai/ToolRegistry#toOpenAITools}).
   * @param {Function} onChunk - Callback for each content chunk.
   * @param {Function} onReasoningChunk - Callback for each reasoning chunk.
   * @param {Function} onToolCall - Callback for each completed tool call
   *   (invoked once, with the fully accumulated call, when the stream ends).
   *   Only called when the model requests tool use.
   * @param {Function} onComplete - Callback when the stream ends. Receives
   *   the `finish_reason` from the API when available.
   * @param {Function} onError - Callback when an error occurs.
   */
  static async streamChat(messages, onChunk, onReasoningChunk, onComplete, onError, tools, onToolCall) {
    // onToolCall is only used when the model requests tool use; guard it so
    // callers that don't support tools can omit it.
    const safeOnToolCall = onToolCall || (() => {});
    try {
      const body = {
        model: AI_CONFIG.model,
        messages: VISION_ENABLED ? toVisionMessages(messages) : messages,
        stream: true,
      };
      if (USAGE_LOGGING_ENABLED) {
        // Ask the provider to include a final SSE chunk with token usage for
        // this call (used by the developer-facing usage log in AIAgent).
        body.stream_options = { include_usage: true };
      }
      if (VISION_ENABLED) {
        body.modalities = ["text", "image"];
      }
      if (tools && tools.length > 0) {
        body.tools = tools;
      }

      const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // Tool-call deltas arrive in fragments keyed by `index`; accumulate
      // them here until the stream ends, then hand each completed call to
      // onToolCall exactly once.
      const toolCalls = {};
      let finishReason = null;
      let streamFailed = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (streamFailed) {
          // Stop pulling from the stream once an error chunk has been seen.
          await reader.cancel().catch(() => {});
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

          if (trimmedLine.startsWith("data: ")) {
            const jsonString = trimmedLine.substring(6);
            let data;
            try {
              data = JSON.parse(jsonString);
            } catch {
              // A malformed line is not a signal of a failing stream; skip
              // it and keep parsing the rest of the stream. (Mid-stream API
              // error chunks arrive as valid JSON with an `error` field.)
              continue;
            }
            try {
              // Some providers (e.g. OpenAI) deliver request-level errors as
              // an in-stream SSE chunk with no `choices` field. Surface those
              // as a real error instead of logging a confusing parse failure.
              if (data.error) {
                const detail =
                  typeof data.error === "string" && data.error.length > 0
                    ? data.error
                    : data.error.message;
                throw new Error(
                  `API stream error: ${
                    detail || "unknown error from the model API"
                  }`
                );
              }
              const choice =
                Array.isArray(data.choices) && data.choices.length > 0
                  ? data.choices[0]
                  : null;

              if (USAGE_LOGGING_ENABLED && data.usage) {
                const u = data.usage;
                usage = {
                  // Every call re-sends the conversation, so sum prompt
                  // tokens across the calls of this turn.
                  prompt_tokens:
                    (usage && usage.prompt_tokens) + (u.prompt_tokens || 0),
                  // The provider reports a running total over the turn for
                  // completion tokens, so keep the last non-null value.
                  completion_tokens:
                    typeof u.completion_tokens === "number"
                      ? u.completion_tokens
                      : (usage && usage.completion_tokens) || 0,
                };
                usage.total_tokens =
                  usage.prompt_tokens + usage.completion_tokens;
              }

              if (choice && choice.finish_reason) {
                finishReason = choice.finish_reason;
              }

              const delta = choice && choice.delta;
              if (delta) {
                if (delta.reasoning_content) {
                  onReasoningChunk(delta.reasoning_content);
                }
                if (delta.content) {
                  onChunk(delta.content);
                }
                if (delta.tool_calls) {
                  for (const call of delta.tool_calls) {
                    const existing = toolCalls[call.index] || {};
                    toolCalls[call.index] = {
                      id: (call.id && call.id) || existing.id,
                      type: existing.type || "function",
                      function: {
                        name:
                          (call.function && call.function.name) ||
                          existing.function.name,
                        arguments:
                          (existing.function
                            ? existing.function.arguments
                            : "") +
                          ((call.function && call.function.arguments) || ""),
                      },
                    };
                  }
                }
              }
            } catch (e) {
              console.error("Error parsing SSE chunk:", e, jsonString);
              // A mid-stream API error is fatal for this turn: report it to
              // the consumer so the turn can be surfaced as a failure (and
              // so no further, invalid, model calls are made).
              streamFailed = true;
              if (onError) onError(e);
              break;
            }
          }
        }
      }

      const completedToolCalls = Object.values(toolCalls);
      // Never report partial tool calls after a mid-stream error: the agent
      // will stop on the error, and feeding a half-accumulated call back to
      // the model would produce an invalid follow-up request.
      if (!streamFailed && completedToolCalls.length > 0) {
        for (const call of completedToolCalls) {
          safeOnToolCall(call);
        }
      }
      // Only complete the turn normally when no mid-stream error was seen.
      if (!streamFailed && onComplete) onComplete(finishReason);
    } catch (error) {
      if (onError) onError(error);
    }
  }
}
