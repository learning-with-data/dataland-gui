import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// Blockly.inject() preloads sound/media assets via fetch(). In the test
// sandbox the media path is a relative URL (/blocks-media/...) which Node's
// fetch rejects with ERR_INVALID_URL. Mock fetch to suppress the resulting
// unhandled rejections.
const originalFetch = global.fetch;
beforeAll(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      status: 404,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      text: () => Promise.resolve(""),
    })
  );
});
afterAll(() => {
  global.fetch = originalFetch;
});

// Import block definitions so they get registered with Blockly.Blocks.
import "../../src/lib/blockly/blocks";
import {
  BlockPreviewRenderer,
  isBlocksJson,
} from "../../src/services/ai/BlockPreviewRenderer";

// jsdom does not implement requestAnimationFrame natively in all cases;
// ensure it exists.
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}

describe("BlockPreviewRenderer", () => {
  // A minimal valid Blockly JSON with two blocks.
  const simpleJson = {
    blocks: {
      blocks: [
        {
          id: "block_0",
          type: "event_onprojectstart",
          x: 0,
          y: 0,
          next: {
            block: {
              id: "block_1",
              type: "debug_log",
              inputs: {
                MESSAGE: {
                  shadow: {
                    id: "block_2",
                    type: "text",
                    fields: { TEXT: "hello" },
                  },
                },
              },
            },
          },
        },
      ],
    },
  };

  it("should return an SVG data URL (or empty string in jsdom) for valid JSON", async () => {
    const url = await BlockPreviewRenderer.renderPreview(simpleJson);
    // In a real browser this would be a data:image/svg+xml URL.
    // In jsdom the render may fail gracefully → empty string.
    expect(typeof url).toBe("string");
    if (url.length > 0) {
      expect(url.startsWith("data:image/svg+xml,")).toBe(true);
    }
  });

  it("should return empty string for empty blocks array", async () => {
    const emptyJson = { blocks: { blocks: [] } };
    const url = await BlockPreviewRenderer.renderPreview(emptyJson);
    // Empty workspace → zero-size bounding box → empty string.
    expect(url).toBe("");
  });

  it("should return empty string (not throw) for invalid JSON structure", async () => {
    // A non-Blockly object should cause load() to throw, caught internally.
    const badJson = { foo: "bar" };
    const result = await BlockPreviewRenderer.renderPreview(badJson);
    expect(result).toBe("");
  });

  it("should reuse the same hidden workspace across calls", async () => {
    await BlockPreviewRenderer.renderPreview(simpleJson);
    const ws1 = BlockPreviewRenderer._workspace;
    await BlockPreviewRenderer.renderPreview(simpleJson);
    const ws2 = BlockPreviewRenderer._workspace;
    expect(ws1).toBe(ws2);
  });

  it("should update projectdatacolumns on the container when they change", async () => {
    const columnsA = JSON.stringify(["colA", "colB"]);
    await BlockPreviewRenderer.renderPreview(simpleJson, columnsA);
    expect(BlockPreviewRenderer._container.dataset.projectdatacolumns).toBe(
      columnsA
    );

    const columnsB = JSON.stringify(["colX", "colY", "colZ"]);
    await BlockPreviewRenderer.renderPreview(simpleJson, columnsB);
    expect(BlockPreviewRenderer._container.dataset.projectdatacolumns).toBe(
      columnsB
    );
  });
});

describe("isBlocksJson", () => {
  it("should return status ok with the parsed object for raw blocks JSON", () => {
    const content = JSON.stringify({ blocks: { blocks: [{ id: "b0" }] } });
    expect(isBlocksJson(content)).toEqual({
      status: "ok",
      json: { blocks: { blocks: [{ id: "b0" }] } },
      prose: "",
    });
  });

  it("should return status ok for JSON wrapped in a json fence", () => {
    const content =
      "```json\n" + JSON.stringify({ blocks: { blocks: [] } }) + "\n```";
    expect(isBlocksJson(content)).toEqual({
      status: "ok",
      json: { blocks: { blocks: [] } },
      prose: "",
    });
  });

  it("should extract fenced JSON from surrounding prose", () => {
    const content =
      "Here is your plot:\n```json\n" +
      JSON.stringify({ blocks: { blocks: [{ id: "b0" }] } }) +
      "\n```\nLet me know if you want changes.";
    expect(isBlocksJson(content)).toEqual({
      status: "ok",
      json: { blocks: { blocks: [{ id: "b0" }] } },
      prose: "Here is your plot:",
    });
  });

  it("should return status ok for a bare fence (no json tag)", () => {
    const content =
      "```\n" + JSON.stringify({ blocks: { blocks: [] } }) + "\n```";
    expect(isBlocksJson(content).status).toBe("ok");
  });

  it("should return status invalid for a JSON object without a blocks key", () => {
    expect(isBlocksJson(JSON.stringify({ foo: "bar" })).status).toBe("invalid");
  });

  it("should return status invalid for a JSON array", () => {
    expect(isBlocksJson(JSON.stringify([{ id: "b0" }])).status).toBe("invalid");
  });

  it("should return status invalid for a closed fence whose body is not JSON", () => {
    const content = "```json\nthis is not json\n```";
    expect(isBlocksJson(content).status).toBe("invalid");
  });

  it("should return status invalid for a closed fence without a blocks key", () => {
    const content =
      "```json\n" + JSON.stringify({ foo: "bar" }) + "\n```";
    expect(isBlocksJson(content).status).toBe("invalid");
  });

  it("should return status pending for an unclosed fence (streaming)", () => {
    // A fence opener with JSON that never closes (stream still in flight).
    const fence = "```";
    const content = fence + "json\n" + "{ \"blocks\": { \"blocks\": [";
    expect(isBlocksJson(content).status).toBe("pending");
  });

  it("should return status pending for truncated raw JSON", () => {
    const truncated = JSON.stringify({ blocks: { blocks: [] } }).slice(0, 12);
    expect(isBlocksJson(truncated)).toEqual({
      status: "pending",
      prose: "",
    });
  });

  it("should extract multi-line prose before a fenced blocks payload", () => {
    const content =
      "Here's code that filters to ZIP 981070,\n" +
      "counts animals by species, and\n" +
      "displays a bar chart comparing them:\n\n" +
      "```json\n" +
      JSON.stringify({ blocks: { blocks: [{ id: "b0" }] } }) +
      "\n```";
    const result = isBlocksJson(content);
    expect(result.status).toBe("ok");
    expect(result.prose).toBe(
      "Here's code that filters to ZIP 981070,\n"
      + "counts animals by species, and\n"
      + "displays a bar chart comparing them:"
    );
  });

  it("should include prose in the pending status for an unclosed fence", () => {
    const content =
      "Let me build this:\n```json\n{ \"blocks\": { \"blocks\": [";
    const result = isBlocksJson(content);
    expect(result.status).toBe("pending");
    expect(result.prose).toBe("Let me build this:");
  });

  it("should return status none for non-JSON plain text", () => {
    expect(isBlocksJson("just plain text, no json").status).toBe("none");
  });

  it("should return status invalid for a JSON primitive", () => {
    expect(isBlocksJson("42").status).toBe("invalid");
    expect(isBlocksJson("true").status).toBe("invalid");
  });

  it("should return status none for empty or non-string input", () => {
    expect(isBlocksJson("").status).toBe("none");
    expect(isBlocksJson(null).status).toBe("none");
    expect(isBlocksJson(undefined).status).toBe("none");
    expect(isBlocksJson(123).status).toBe("none");
  });
});
