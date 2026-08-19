import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

// The vision gate in AIService reads import.meta.env at module load. This
// test file enables it by:
//   1. Stubbing the env var before anything else runs (see top-level call
//      below, which hoists before the static import).
//   2. Re-importing AIService dynamically in beforeAll after the stub is
//      live, so a *fresh* module instance is evaluated with the stub in
//      place and its module-level VISION_ENABLED is "true".
// The static import at the top is only used as a fallback (and is what the
// "disabled" behavior in the sibling AIService.test.js exercises).

vi.stubEnv("VITE_AI_VISION", "true");

let AIService;
beforeAll(async () => {
  // Reset the module cache so the fresh import re-evaluates the module
  // with the stubbed env in effect.
  vi.resetModules();
  const mod = await import("../../src/services/ai/AIService");
  AIService = mod.AIService;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function mockSseResponse(sseText) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(sseText);

  const reader = {
    read: vi.fn(async () => {
      if (reader._index >= bytes.length) {
        return { value: undefined, done: true };
      }
      const chunk = bytes.slice(reader._index, reader._index + 1);
      reader._index += 1;
      return { value: chunk, done: false };
    }),
    _index: 0,
    cancel: vi.fn(async () => {}),
  };

  return {
    ok: true,
    status: 200,
    statusText: "OK",
    body: { getReader: () => reader },
  };
}

describe("AIService vision support", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should send content-part messages and modalities when vision is enabled", async () => {
    fetch.mockResolvedValue(mockSseResponse(""));

    const messages = [
      { role: "system", content: "You are helpful." },
      { role: "user", content: "What does the chart show?" },
      { role: "assistant", content: "Let me look." },
    ];

    await AIService.streamChat(
      messages,
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.modalities).toEqual(["text", "image"]);
    expect(body.messages).toEqual([
      { role: "system", content: "You are helpful." },
      { role: "user", content: "What does the chart show?" },
      { role: "assistant", content: [{ type: "text", text: "Let me look." }] },
    ]);
    // The original message list is not mutated.
    expect(messages[2].content).toBe("Let me look.");
  });

  it("should attach an image_url part to tool results carrying an image", async () => {
    fetch.mockResolvedValue(mockSseResponse(""));

    const toolContent = JSON.stringify({
      image: "data:image/png;base64,QUJD",
      width: 800,
    });
    const messages = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "" },
      { role: "tool", tool_call_id: "call_1", content: toolContent },
    ];

    await AIService.streamChat(
      messages,
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    const toolMessage = body.messages.find((m) => m.role === "tool");
    expect(toolMessage.tool_call_id).toBe("call_1");
    expect(toolMessage.content).toEqual([
      { type: "text", text: toolContent },
      { type: "image_url", image_url: { url: "data:image/png;base64,QUJD" } },
    ]);
  });

  it("should keep tool results without images as text-only parts", async () => {
    fetch.mockResolvedValue(mockSseResponse(""));

    const plainToolContent = "{\"columns\":[]}";
    const messages = [
      { role: "tool", tool_call_id: "call_1", content: plainToolContent },
    ];

    await AIService.streamChat(messages, vi.fn(), vi.fn(), vi.fn(), vi.fn());

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.messages[0].content).toEqual([
      { type: "text", text: plainToolContent },
    ]);
  });
});
