import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIAgent } from "../../src/services/ai/AIAgent";
import {
  AIService,
  getUsage,
  getSessionUsage,
} from "../../src/services/ai/AIService";
import { ToolRegistry } from "../../src/services/ai/ToolRegistry";

vi.mock("../../src/services/ai/AIService", () => ({
  AIService: {
    streamChat: vi.fn(),
  },
  getUsage: vi.fn(),
  getSessionUsage: vi.fn(),
  commitSessionUsage: vi.fn(),
  resetUsage: vi.fn(),
}));

const toolContext = {
  runtime: {
    getCurrentData: () => [{ X: 1 }],
    getCurrentColumns: () => ["X"],
    getVisualizationSpec: () => ({}),
    addColumn: vi.fn(),
    addVariable: vi.fn(),
    getVariables: () => ({}),
  },
  editor: { getWorkspace: () => ({ save: () => ({ blocks: [] }) }), loadJsonCode: vi.fn() },
  microworld: "plots",
};

/**
 * Returns an onToolEvent callback that records events and resolves the
 * confirmation promise for pending mutating calls using the given decision
 * function (id -> allowed).
 */
const makeConfirmingToolEvent = (decisions = {}) => {
  const events = [];
  const onToolEvent = (event) => {
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx >= 0) events[idx] = event;
    else events.push(event);
    if (event.status === "pending_confirmation") {
      return Promise.resolve({ allowed: decisions[event.id] !== false });
    }
    return undefined;
  };
  return { events, onToolEvent };
};

/**
 * Queues a series of "turns" for the mocked AIService.streamChat. Each turn
 * is an object with `content`, `reasoning`, and `toolCalls` (each a
 * `{ id, function: { name, arguments } }` pair). The mock invokes the
 * streamChat callbacks exactly like the real SSE parser would.
 */
const queueTurns = (turns) => {
  let i = 0;
  AIService.streamChat.mockImplementation(
    (messages, onChunk, onReasoning, onComplete, onError, tools, onToolCall) => {
      const turn = turns[Math.min(i, turns.length - 1)];
      i += 1;
      if (turn.error) {
        onError(new Error(turn.error));
      } else {
        if (turn.content) onChunk(turn.content);
        if (turn.reasoning) onReasoning(turn.reasoning);
        for (const call of turn.toolCalls || []) {
          onToolCall(call);
        }
      }
      onComplete("stop");
      return Promise.resolve();
    }
  );
};

describe("AIAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should complete in one turn when the model returns only content", async () => {
    queueTurns([{ content: "Here are some questions for your data." }]);

    let completed = null;
    const onContentChunk = vi.fn();
    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onContentChunk,
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    expect(AIService.streamChat).toHaveBeenCalledTimes(1);
    // Tools should have been passed to the API.
    const toolsArg = AIService.streamChat.mock.calls[0][5];
    expect(toolsArg.length).toBeGreaterThan(0);
    expect(toolsArg[0].type).toBe("function");

    expect(onContentChunk).toHaveBeenCalledWith(
      "Here are some questions for your data."
    );
    expect(completed).not.toBeNull();
    expect(completed.message).toEqual({
      role: "assistant",
      content: "Here are some questions for your data.",
      reasoning: "",
    });
    expect(completed.toolEvents).toEqual([]);
  });

  it("should execute a tool call, feed the result back, and finish on the next turn", async () => {
    queueTurns([
      {
        toolCalls: [
          {
            id: "call_1",
            function: {
              name: "getDataColumns",
              arguments: "{}",
            },
          },
        ],
      },
      { content: "Your table has columns: X." },
    ]);

    const toolEvents = [];
    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "what columns do I have?" }],
      toolContext,
      onToolEvent: (event) => {
        const idx = toolEvents.findIndex((e) => e.id === event.id);
        if (idx >= 0) toolEvents[idx] = event;
        else toolEvents.push(event);
      },
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    expect(AIService.streamChat).toHaveBeenCalledTimes(2);

    // The second call's message list must contain the assistant tool_calls
    // message and the tool result message.
    const secondMessages = AIService.streamChat.mock.calls[1][0];
    const assistantToolMsg = secondMessages.find(
      (m) => m.role === "assistant" && m.tool_calls
    );
    expect(assistantToolMsg).toBeDefined();
    expect(assistantToolMsg.tool_calls).toHaveLength(1);

    const toolMsg = secondMessages.find((m) => m.role === "tool");
    expect(toolMsg).toBeDefined();
    expect(toolMsg.tool_call_id).toBe("call_1");
    expect(toolMsg.name).toBe("getDataColumns");
    expect(JSON.parse(toolMsg.content).columns).toEqual([
      { name: "X", type: "number" },
    ]);

    // Both "started" and "done" events should have been reported.
    expect(toolEvents).toHaveLength(1);
    expect(toolEvents[0].status).toBe("done");
    expect(toolEvents[0].result).toBeTruthy();

    expect(completed.message.content).toBe("Your table has columns: X.");
  });

  it("should feed an error back to the model when tool arguments are invalid JSON", async () => {
    queueTurns([
      {
        toolCalls: [
          {
            id: "call_bad",
            function: {
              name: "getDataColumns",
              arguments: "{not valid json",
            },
          },
        ],
      },
      { content: "Recovered." },
    ]);

    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    const secondMessages = AIService.streamChat.mock.calls[1][0];
    const toolMsg = secondMessages.find((m) => m.role === "tool");
    expect(toolMsg).toBeDefined();
    expect(JSON.parse(toolMsg.content).error).toContain("valid JSON");
    expect(completed.message.content).toBe("Recovered.");
  });

  it("should cap the number of turns and report a fallback message", async () => {
    // The model asks for a tool on every turn, never producing a final
    // answer.
    const endless = {
      toolCalls: [
        {
          id: "call_loop",
          function: { name: "getDataColumns", arguments: "{}" },
        },
      ],
    };
    queueTurns([endless]);

    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    expect(AIService.streamChat).toHaveBeenCalledTimes(AIAgent.MAX_TURNS);
    expect(completed.message.content).toContain("maximum number of steps");
    // The fallback message is flagged so the UI can show it even though it
    // is not a genuine model answer, and it summarizes the steps that did
    // complete (the same tool ran on every turn; only the first few are
    // listed).
    expect(completed.message.max_turns).toBe(true);
    expect(completed.message.content).toContain("getDataColumns");
    expect(completed.message.content).toContain("✓");
    expect(completed.toolEvents.length).toBe(AIAgent.MAX_TURNS);
  });

  it("should summarize completed steps in the max-turns fallback message", async () => {
    // Mutating tools carry a human-readable description from the
    // confirmation step; the summary should list them in order, with a
    // decline marked with ✗.
    const endless = {
      toolCalls: [
        {
          id: "c1",
          function: { name: "addDataColumn", arguments: "{\"column_name\":\"a\"}" },
        },
        {
          id: "c2",
          function: { name: "addDataColumn", arguments: "{\"column_name\":\"b\"}" },
        },
        {
          id: "c3",
          function: { name: "getDataColumns", arguments: "{}" },
        },
      ],
    };
    queueTurns([endless]);

    const { onToolEvent } = makeConfirmingToolEvent({ c2: false });
    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "add columns" }],
      toolContext,
      onToolEvent,
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    const content = completed.message.content;
    expect(completed.message.max_turns).toBe(true);
    // Both allowed mutations are listed with their descriptions.
    expect(content).toContain("add a column named `a`");
    expect(content).toContain("add a column named `b`");
    // The declined call is listed but marked with ✗.
    const bLine = content.split("\n").find((l) => l.includes("named `b`"));
    expect(bLine).toContain("✗");
  });

  it("should stop and report an error when the stream fails", async () => {
    queueTurns([{ error: "API exploded" }]);

    let completed = null;
    const onError = vi.fn();
    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onComplete: (result) => {
        completed = result;
      },
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe("API exploded");
    expect(completed).toBeNull();
  });

  it("should report reasoning chunks to onReasoningChunk", async () => {
    queueTurns([{ content: "answer", reasoning: "hmm" }]);

    const onReasoningChunk = vi.fn();
    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onReasoningChunk,
      onComplete: vi.fn(),
      onError: vi.fn(),
    });

    expect(onReasoningChunk).toHaveBeenCalledWith("hmm");
  });

  it("should attach the turn's reasoning to assistant tool_calls messages so the transcript preserves it", async () => {
    queueTurns([
      {
        reasoning: "let me check the columns first",
        toolCalls: [
          {
            id: "call_r",
            function: { name: "getDataColumns", arguments: "{}" },
          },
        ],
      },
      { content: "Your table has one column." },
    ]);

    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onComplete: vi.fn(),
      onError: vi.fn(),
    });

    const secondMessages = AIService.streamChat.mock.calls[1][0];
    const assistantToolMsg = secondMessages.find(
      (m) => m.role === "assistant" && m.tool_calls
    );
    expect(assistantToolMsg.reasoning).toBe("let me check the columns first");
  });

  it("should pass the live event object (not a copy) to onToolEvent so in-place updates stay visible", async () => {
    queueTurns([
      {
        toolCalls: [
          {
            id: "call_live",
            function: { name: "getDataColumns", arguments: "{}" },
          },
        ],
      },
      { content: "done" },
    ]);

    const seen = [];
    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onToolEvent: (event) => {
        seen.push(event);
      },
      onComplete: vi.fn(),
      onError: vi.fn(),
    });

    expect(seen.length).toBe(2);
    // Both emissions must be the same object, mutated in place.
    expect(seen[1]).toBe(seen[0]);
    expect(seen[0].status).toBe("done");
  });

  it("should ask for confirmation, execute a mutating tool when allowed, and feed the result back", async () => {
    queueTurns([
      {
        toolCalls: [
          {
            id: "call_mut",
            function: { name: "addDataColumn", arguments: "{\"column_name\":\"total\"}" },
          },
        ],
      },
      { content: "Done, the column was added." },
    ]);

    const { events, onToolEvent } = makeConfirmingToolEvent();
    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "add a column total" }],
      toolContext,
      onToolEvent,
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    expect(toolContext.runtime.addColumn).toHaveBeenCalledWith("total");

    // The event went through the pending_confirmation status before done,
    // and records that the user allowed it.
    const event = events.find((e) => e.id === "call_mut");
    expect(event.status).toBe("done");
    expect(event.confirmed).toBe(true);
    expect(event.result).toContain("\"success\":true");
    expect(event.description).toContain("total");

    // The model saw the success result.
    const secondMessages = AIService.streamChat.mock.calls[1][0];
    const toolMsg = secondMessages.find((m) => m.role === "tool");
    expect(JSON.parse(toolMsg.content)).toEqual({ success: true, column: "total" });
    expect(completed.message.content).toBe("Done, the column was added.");
  });

  it("should not execute a mutating tool when the user declines it", async () => {
    queueTurns([
      {
        toolCalls: [
          {
            id: "call_declined",
            function: { name: "addDataColumn", arguments: "{\"column_name\":\"total\"}" },
          },
        ],
      },
      { content: "Understood, I will not add the column." },
    ]);

    const { events, onToolEvent } = makeConfirmingToolEvent({ call_declined: false });
    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "add a column" }],
      toolContext,
      onToolEvent,
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    expect(toolContext.runtime.addColumn).not.toHaveBeenCalled();

    const event = events.find((e) => e.id === "call_declined");
    expect(event.status).toBe("done");
    expect(event.confirmed).toBe(false);

    const secondMessages = AIService.streamChat.mock.calls[1][0];
    const toolMsg = secondMessages.find((m) => m.role === "tool");
    expect(toolMsg.content).toContain("declined");
    expect(completed.message.content).toContain("will not add");
  });

  it("should skip the confirmation prompt when a mutating call fails validation", async () => {
    queueTurns([
      {
        toolCalls: [
          {
            id: "call_invalid",
            function: { name: "addDataColumn", arguments: "{\"column_name\":\"X\"}" },
          },
        ],
      },
      { content: "That column already exists." },
    ]);

    const { events, onToolEvent } = makeConfirmingToolEvent();
    await AIAgent.run({
      messages: [{ role: "user", content: "add column X" }],
      toolContext,
      onToolEvent,
      onComplete: vi.fn(),
      onError: vi.fn(),
    });

    // Never confirmed, never executed.
    const event = events.find((e) => e.id === "call_invalid");
    expect(event.status).toBe("done");
    expect(event.description).toBeUndefined();
    expect(toolContext.runtime.addColumn).not.toHaveBeenCalled();

    const secondMessages = AIService.streamChat.mock.calls[1][0];
    const toolMsg = secondMessages.find((m) => m.role === "tool");
    expect(JSON.parse(toolMsg.content).error).toContain("already exists");
  });

  it("should still feed a tool result to the model when execution fails", async () => {
    const executeSpy = vi
      .spyOn(ToolRegistry, "executeTool")
      .mockResolvedValue({
        ok: false,
        result: JSON.stringify({ error: "The editor failed while running" }),
      });
    queueTurns([
      {
        toolCalls: [
          {
            id: "call_fail",
            function: { name: "getDataColumns", arguments: "{}" },
          },
        ],
      },
      { content: "Recovered from the failure." },
    ]);

    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onToolEvent: vi.fn(),
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    // The failed call still produces a tool result message so the next
    // model call stays valid.
    const secondMessages = AIService.streamChat.mock.calls[1][0];
    const toolMsg = secondMessages.find((m) => m.role === "tool");
    expect(toolMsg).toBeDefined();
    expect(toolMsg.tool_call_id).toBe("call_fail");
    expect(JSON.parse(toolMsg.content).error).toBe(
      "The editor failed while running"
    );
    expect(completed.message.content).toBe("Recovered from the failure.");
    executeSpy.mockRestore();
  });

  it("should stop the agent without executing when the turn is cancelled while awaiting confirmation", async () => {
    queueTurns([
      {
        toolCalls: [
          {
            id: "call_cancelled",
            function: { name: "addDataColumn", arguments: "{\"column_name\":\"total\"}" },
          },
        ],
      },
    ]);

    const { events, onToolEvent } = makeConfirmingToolEvent();
    // The user "clears history" while the confirmation is pending.
    const cancelledRef = { value: false };
    let completed = null;
    let timedOut = null;

    const runPromise = AIAgent.run({
      messages: [{ role: "user", content: "add a column" }],
      toolContext,
      onToolEvent: (event) => {
        const result = onToolEvent(event);
        if (event.status === "pending_confirmation") {
          // Simulate the user clearing the history right after the card shows.
          cancelledRef.value = true;
        }
        return result;
      },
      isCancelled: () => cancelledRef.value,
      onConfirmationTimeout: () => {
        timedOut = true;
      },
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    await runPromise;

    expect(toolContext.runtime.addColumn).not.toHaveBeenCalled();
    expect(completed).toBeNull();
    expect(timedOut).toBe(true);
    expect(events.find((e) => e.id === "call_cancelled").status).toBe("pending_confirmation");
    // Only one model call happened (no continuation after cancellation).
    expect(AIService.streamChat).toHaveBeenCalledTimes(1);
  });

  it("should cap successful mutations per turn and tell the model so", async () => {
    // The model asks for three new columns in one call set, then a fourth.
    const colCall = (id, name) => ({
      id,
      function: { name: "addDataColumn", arguments: JSON.stringify({ column_name: name }) },
    });
    queueTurns([
      { toolCalls: [colCall("c1", "a"), colCall("c2", "b"), colCall("c3", "c"), colCall("c4", "d")] },
      { content: "Three columns were added; please ask again for the fourth." },
    ]);

    const { events, onToolEvent } = makeConfirmingToolEvent();
    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "add four columns" }],
      toolContext,
      onToolEvent,
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    expect(toolContext.runtime.addColumn).toHaveBeenCalledTimes(3);
    const fourth = events.find((e) => e.id === "c4");
    expect(fourth.status).toBe("done");
    expect(fourth.error).toBe("mutation cap reached");

    const secondMessages = AIService.streamChat.mock.calls[1][0];
    const dMsg = secondMessages.find((m) => m.role === "tool" && m.tool_call_id === "c4");
    expect(JSON.parse(dMsg.content).error).toContain("maximum number");
    expect(completed).not.toBeNull();
  });

  it("should log per-turn and session token usage when the turn finishes", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    queueTurns([{ content: "Hello!" }]);

    // Simulate the provider reporting usage for this (single) call. The
    // AIService module is mocked in this file, so we stub its exports (which
    // AIAgent imports) to return fixed usage objects.
    const turnUsage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };
    const sessionUsage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };
    vi.mocked(getUsage).mockReturnValue(turnUsage);
    vi.mocked(getSessionUsage).mockReturnValue(sessionUsage);

    let completed = null;
    await AIAgent.run({
      messages: [{ role: "user", content: "hi" }],
      toolContext,
      onComplete: (result) => {
        completed = result;
      },
      onError: vi.fn(),
    });

    expect(completed.message.content).toBe("Hello!");
    // The agent read the accumulated usage and logged it once for the turn,
    // including the running session total.
    expect(getUsage).toHaveBeenCalled();
    expect(getSessionUsage).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "[AI tokens] turn finished " +
        "turn: prompt 10, completion 5, total 15; " +
        "session: prompt 10, completion 5, total 15 tokens"
    );
    logSpy.mockRestore();
    vi.mocked(getUsage).mockReset();
    vi.mocked(getSessionUsage).mockReset();
  });
});
