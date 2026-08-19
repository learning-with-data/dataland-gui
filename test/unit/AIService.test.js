import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIService, getUsage, getSessionUsage, commitSessionUsage, resetUsage } from "../../src/services/ai/AIService";

/**
 * Builds a mock fetch Response whose body streams the given SSE text.
 * @param {string} sseText The full SSE payload to stream.
 * @param {number} [status] HTTP status code.
 */
function mockSseResponse(sseText, status = 200) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(sseText);

  const reader = {
    read: vi.fn(async () => {
      if (reader._index >= bytes.length) {
        return { value: undefined, done: true };
      }
      const chunk = bytes.slice(reader._index, reader._index + chunkSize);
      reader._index += chunkSize;
      return { value: chunk, done: false };
    }),
    _index: 0,
    cancel: vi.fn(async () => {}),
  };

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    body: { getReader: () => reader },
  };
}

// Simulate chunked delivery (smaller chunks than a full line) to verify
// the buffer-accumulation logic in AIService.
let chunkSize = 1;

describe("AIService", () => {
  beforeEach(() => {
    chunkSize = 1;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should call fetch with the correct URL, headers, and body", async () => {
    fetch.mockResolvedValue(mockSseResponse(""));

    const messages = [{ role: "user", content: "hello" }];
    await AIService.streamChat(
      messages,
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain("/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["Authorization"]).toMatch(/^Bearer /);

    const body = JSON.parse(init.body);
    expect(body.stream).toBe(true);
    // Vision is off in the default test environment, so the message list is
    // sent as-is (a plain array, not content parts).
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages[0]).toEqual({ role: "user", content: "hello" });
  });

  it("should route content deltas to onChunk", async () => {
    const sse = [
      "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}",
      "",
      "data: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onChunk = vi.fn();
    const onReasoning = vi.fn();
    const onComplete = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      onChunk,
      onReasoning,
      onComplete,
      vi.fn()
    );

    expect(onChunk).toHaveBeenCalledWith("Hello");
    expect(onChunk).toHaveBeenCalledWith(" world");
    expect(onReasoning).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should route reasoning_content deltas to onReasoningChunk", async () => {
    const sse = [
      "data: {\"choices\":[{\"delta\":{\"reasoning_content\":\"Thinking...\"}}]}",
      "",
      "data: {\"choices\":[{\"delta\":{\"reasoning_content\":\" more\"}}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onChunk = vi.fn();
    const onReasoning = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      onChunk,
      onReasoning,
      vi.fn(),
      vi.fn()
    );

    expect(onReasoning).toHaveBeenCalledWith("Thinking...");
    expect(onReasoning).toHaveBeenCalledWith(" more");
    expect(onChunk).not.toHaveBeenCalled();
  });

  it("should handle content and reasoning in the same stream", async () => {
    const sse = [
      "data: {\"choices\":[{\"delta\":{\"reasoning_content\":\"step 1\"}}]}",
      "",
      "data: {\"choices\":[{\"delta\":{\"content\":\"answer\"}}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onChunk = vi.fn();
    const onReasoning = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      onChunk,
      onReasoning,
      vi.fn(),
      vi.fn()
    );

    expect(onReasoning).toHaveBeenCalledWith("step 1");
    expect(onChunk).toHaveBeenCalledWith("answer");
  });

  it("should ignore empty lines and data: [DONE]", async () => {
    const sse = [
      "",
      "data: [DONE]",
      "",
      "data: {\"choices\":[{\"delta\":{\"content\":\"only\"}}]}",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onChunk = vi.fn();
    const onComplete = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      onChunk,
      vi.fn(),
      onComplete,
      vi.fn()
    );

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onChunk).toHaveBeenCalledWith("only");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should handle SSE data split across multiple chunks", async () => {
    // Use a small chunk size to force the buffer to accumulate across reads.
    chunkSize = 5;
    const sse = [
      "data: {\"choices\":[{\"delta\":{\"content\":\"split\"}}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onChunk = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      onChunk,
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    expect(onChunk).toHaveBeenCalledWith("split");
  });

  it("should ignore delta objects that have neither content nor reasoning", async () => {
    const sse = [
      "data: {\"choices\":[{\"delta\":{}}]}",
      "",
      "data: {\"choices\":[{\"delta\":{\"role\":\"assistant\"}}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onChunk = vi.fn();
    const onReasoning = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      onChunk,
      onReasoning,
      vi.fn(),
      vi.fn()
    );

    expect(onChunk).not.toHaveBeenCalled();
    expect(onReasoning).not.toHaveBeenCalled();
  });

  it("should call onError when the API returns a non-OK status", async () => {
    fetch.mockResolvedValue(mockSseResponse("", 500));

    const onError = vi.fn();
    const onComplete = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      onComplete,
      onError
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toContain("500");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should call onError when fetch throws", async () => {
    fetch.mockRejectedValue(new Error("Network failure"));

    const onError = vi.fn();
    const onComplete = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      onComplete,
      onError
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe("Network failure");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should not call onError or fail on malformed JSON in an SSE chunk", async () => {
    const sse = [
      "data: {not valid json}",
      "",
      "data: {\"choices\":[{\"delta\":{\"content\":\"recovered\"}}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    // Silence the console.error from the parse-failure branch.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onChunk = vi.fn();
    const onError = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      onChunk,
      vi.fn(),
      vi.fn(),
      vi.fn(),
      onError
    );

    // The malformed line is skipped; the valid line still streams through.
    expect(onChunk).toHaveBeenCalledWith("recovered");
    expect(onError).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should call onError with the API message when the stream contains an error chunk", async () => {
    // Some providers (e.g. OpenAI) deliver request-level errors as an
    // in-stream SSE chunk with no `choices` field.
    const sse = [
      "data: {\"error\":{\"code\":400,\"message\":\"Assistant message must contain either 'content' or 'tool_calls'!\",\"status_code\":400,\"type\":\"invalid_request_error\"}}",
      "",
    ].join("\n");

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockResolvedValue(mockSseResponse(sse));

    const onError = vi.fn();
    const onComplete = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      onComplete,
      onError
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toContain(
      "must contain either 'content' or 'tool_calls'"
    );
    expect(onComplete).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should stop reading the stream after a mid-stream error chunk", async () => {
    const sse = [
      "data: {\"error\":{\"message\":\"boom\"}}",
      "",
      "data: {\"choices\":[{\"delta\":{\"content\":\"never\"}}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    const response = mockSseResponse(sse);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockResolvedValue(response);

    const onChunk = vi.fn();
    const onError = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      onChunk,
      vi.fn(),
      vi.fn(),
      onError
    );

    expect(onError).toHaveBeenCalledTimes(1);
    // The reader is cancelled after the error; the later content chunk is
    // never delivered.
    expect(onChunk).not.toHaveBeenCalled();
    expect(response.body.getReader().cancel).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("should not report tool calls after a mid-stream error chunk", async () => {
    const sse = [
      "data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":0,\"id\":\"c1\",\"function\":{\"name\":\"getDataColumns\",\"arguments\":\"{}\"}}]}}]}",
      "",
      "data: {\"error\":{\"message\":\"stream died\"}}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockResolvedValue(mockSseResponse(sse));

    const onError = vi.fn();
    const onComplete = vi.fn();
    const onToolCall = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      onComplete,
      onError,
      ["dummy"],
      onToolCall
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onToolCall).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("AIService tool calling", () => {
  beforeEach(() => {
    chunkSize = 1;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should pass tools through in the request body when provided", async () => {
    fetch.mockResolvedValue(mockSseResponse(""));
    const tools = [
      {
        type: "function",
        function: { name: "getDataColumns", parameters: { type: "object" } },
      },
    ];

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      tools
    );

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.tools).toEqual(tools);
  });

  it("should omit tools from the request body when none are provided", async () => {
    fetch.mockResolvedValue(mockSseResponse(""));

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("tools");
  });

  it("should accumulate fragmented tool_calls and report them at the end", async () => {
    // The tool call is split across chunks, exactly as the SSE protocol
    // delivers it (id+name first, then argument fragments).
    const sse = [
      "data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":0,\"id\":\"call_1\",\"function\":{\"name\":\"readDataTable\"}}]}}]}",
      "",
      "data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"arguments\":\"{\\\"num_\"}}]}}]}",
      "",
      "data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"arguments\":\"rows\\\":5}\"}}]}}]}",
      "",
      "data: {\"choices\":[{\"delta\":{},\"finish_reason\":\"tool_calls\"}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onToolCall = vi.fn();
    const onComplete = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      onComplete,
      vi.fn(),
      ["dummy"],
      onToolCall
    );

    expect(onToolCall).toHaveBeenCalledTimes(1);
    const call = onToolCall.mock.calls[0][0];
    expect(call.id).toBe("call_1");
    expect(call.function.name).toBe("readDataTable");
    expect(call.function.arguments).toBe("{\"num_rows\":5}");
    expect(onComplete).toHaveBeenCalledWith("tool_calls");
  });

  it("should accumulate multiple tool calls in one turn", async () => {
    const sse = [
      "data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":0,\"id\":\"a\",\"function\":{\"name\":\"first\",\"arguments\":\"{}\"}}]}}]}",
      "",
      "data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":1,\"id\":\"b\",\"function\":{\"name\":\"second\",\"arguments\":\"{}\"}}]}}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onToolCall = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      ["dummy"],
      onToolCall
    );

    expect(onToolCall).toHaveBeenCalledTimes(2);
    const calls = onToolCall.mock.calls.map((c) => c[0]);
    expect(calls.map((c) => c.function.name)).toEqual(["first", "second"]);
  });

  it("should not call onToolCall when the model returns plain content only", async () => {
    const sse = [
      "data: {\"choices\":[{\"delta\":{\"content\":\"hello\"},\"finish_reason\":\"stop\"}]}",
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetch.mockResolvedValue(mockSseResponse(sse));

    const onToolCall = vi.fn();

    await AIService.streamChat(
      [{ role: "user", content: "hi" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      ["dummy"],
      onToolCall
    );

    expect(onToolCall).not.toHaveBeenCalled();
  });

  it("should not add vision fields when vision is disabled", async () => {
    fetch.mockResolvedValue(mockSseResponse(""));

    const messages = [
      { role: "system", content: "You are helpful." },
      { role: "assistant", content: "Let me look." },
    ];

    await AIService.streamChat(messages, vi.fn(), vi.fn(), vi.fn(), vi.fn());

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    // Assistant messages stay as plain strings (not content parts), and no
    // modalities field is added, when vision is disabled.
    expect(body.messages[1]).toEqual({ role: "assistant", content: "Let me look." });
    expect(body).not.toHaveProperty("modalities");
  });
});

// Token-usage tracking is gated on import.meta.env.DEV, which vitest does not
// set by default; the vitest test.env baseline (see vite.config.mjs) sets
// VITE_DEV=true so these tests exercise the enabled path. (The disabled path
// is a no-op by construction: stream_options is not sent and usage is never
// accumulated, so getUsage() stays null.)
describe("AIService token usage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetUsage(true);
  });

  it("should request usage in the stream and accumulate it across calls", async () => {
    fetch.mockResolvedValue(
      mockSseResponse(
        "data: {\"choices\":[{\"delta\":{\"content\":\"hi\"}}]}" +
          "\n\n" +
          "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":5}}" +
          "\n\n"
      )
    );

    await AIService.streamChat(
      [{ role: "user", content: "hello" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    // The API is asked to include usage for this call.
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.stream_options).toEqual({ include_usage: true });

    // The final chunk's usage is recorded for the current turn.
    expect(getUsage()).toEqual({
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    });
  });

  it("should sum prompt tokens and keep the latest completion total across calls", async () => {
    // First model call of a multi-call turn.
    fetch.mockResolvedValue(
      mockSseResponse(
        "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":100,\"completion_tokens\":20}}" +
          "\n\n"
      )
    );
    await AIService.streamChat(
      [{ role: "user", content: "a" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    // Second call re-sends the growing conversation (prompt grows), and the
    // provider reports a running completion total.
    fetch.mockResolvedValue(
      mockSseResponse(
        "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":150,\"completion_tokens\":30}}" +
          "\n\n"
      )
    );
    await AIService.streamChat(
      [{ role: "user", content: "b" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    expect(getUsage()).toEqual({
      prompt_tokens: 250, // 100 + 150 (summed across calls)
      completion_tokens: 30, // last reported running total
      total_tokens: 280,
    });
  });

  it("should return null until any call reports usage", async () => {
    fetch.mockResolvedValue(
      mockSseResponse("data: {\"choices\":[{\"delta\":{\"content\":\"hi\"}}]}\n\n")
    );
    await AIService.streamChat(
      [{ role: "user", content: "hello" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    expect(getUsage()).toBeNull();
  });

  it("should reset to null after resetUsage", async () => {
    fetch.mockResolvedValue(
      mockSseResponse(
        "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":5}}" +
          "\n\n"
      )
    );
    await AIService.streamChat(
      [{ role: "user", content: "hello" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    expect(getUsage()).not.toBeNull();

    resetUsage();
    expect(getUsage()).toBeNull();
  });

  it("should accumulate the session total across committed turns", async () => {
    // First turn of the session.
    fetch.mockResolvedValue(
      mockSseResponse(
        "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":100,\"completion_tokens\":20}}" +
          "\n\n"
      )
    );
    await AIService.streamChat(
      [{ role: "user", content: "a" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    expect(getSessionUsage()).toBeNull(); // not committed yet

    // The agent folds the finished turn into the session total.
    commitSessionUsage();
    expect(getSessionUsage()).toEqual({
      prompt_tokens: 100,
      completion_tokens: 20,
      total_tokens: 120,
    });

    // Second turn: a fresh per-turn accumulator (the agent calls resetUsage
    // at the start of the turn), then committed on top of the session total.
    resetUsage();
    fetch.mockResolvedValue(
      mockSseResponse(
        "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":150,\"completion_tokens\":30}}" +
          "\n\n"
      )
    );
    await AIService.streamChat(
      [{ role: "user", content: "b" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    commitSessionUsage();
    expect(getSessionUsage()).toEqual({
      prompt_tokens: 250, // 100 + 150
      completion_tokens: 50, // 20 + 30
      total_tokens: 300,
    });
  });

  it("should leave the session total unchanged when a turn reported no usage", async () => {
    // A turn with no usage chunk leaves the session total untouched.
    fetch.mockResolvedValue(
      mockSseResponse("data: {\"choices\":[{\"delta\":{\"content\":\"hi\"}}]}\n\n")
    );
    await AIService.streamChat(
      [{ role: "user", content: "a" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    expect(getUsage()).toBeNull();
    commitSessionUsage();
    expect(getSessionUsage()).toBeNull();
  });

  it("should reset only the session total when resetUsage(true) is called", async () => {
    fetch.mockResolvedValue(
      mockSseResponse(
        "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":5}}" +
          "\n\n"
      )
    );
    await AIService.streamChat(
      [{ role: "user", content: "hello" }],
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );
    commitSessionUsage();
    expect(getSessionUsage()).not.toBeNull();

    // Clearing the history starts a new session: both accumulators reset.
    resetUsage(true);
    expect(getUsage()).toBeNull();
    expect(getSessionUsage()).toBeNull();
  });
});
