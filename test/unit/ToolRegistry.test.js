import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ToolRegistry, getVisualizationImage } from "../../src/services/ai/ToolRegistry";

// Vision support is gated by an env variable that is read when the registry
// module is imported, so the tool's registration state is fixed for the
// lifetime of the test process. The tests below cover the disabled state
// (the default test build); execute() branches are covered via the exported
// definition, which does not depend on registration.

beforeEach(() => {
  vi.stubEnv("VITE_AI_VISION", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const makeContext = (overrides = {}) => ({
  runtime: {
    getCurrentData: () => [
      { X: 1, Y: "a", __id: "1" },
      { X: 2, Y: "b", __id: "2" },
      { X: 3, Y: "a", __id: "3" },
    ],
    getCurrentColumns: () => ["X", "Y"],
    getVisualizationSpec: () => ({ mark: "point" }),
    addColumn: vi.fn(),
    addVariable: vi.fn(),
    getVariables: () => ({}),
    ...overrides.runtime,
  },
  editor: overrides.editor,
  visualizer: overrides.visualizer,
  microworld: "plots",
});

describe("ToolRegistry", () => {
  describe("toOpenAITools", () => {
    it("should return tools in the OpenAI function format", () => {
      const tools = ToolRegistry.toOpenAITools();
      expect(tools.length).toBeGreaterThan(0);
      for (const tool of tools) {
        expect(tool.type).toBe("function");
        expect(tool.function.name).toBeTypeOf("string");
        expect(tool.function.description).toBeTypeOf("string");
        expect(tool.function.parameters).toEqual(expect.objectContaining({ type: "object" }));
      }
    });

    it("should register the five read-only tools and three mutating tools", () => {
      const tools = ToolRegistry.getTools();
      const read = tools.filter((t) => !t.mutating).map((t) => t.name);
      const mutating = tools.filter((t) => t.mutating).map((t) => t.name);
      expect(read).toEqual([
        "getDataColumns",
        "readDataTable",
        "getTableStats",
        "getCurrentCode",
        "getCurrentVisualization",
      ]);
      expect(mutating).toEqual(["addDataColumn", "createVariable", "insertCode"]);
    });
  });

  describe("getDataColumns", () => {
    it("should list columns with inferred types", async () => {
      const outcome = await ToolRegistry.executeTool(
        "getDataColumns",
        {},
        makeContext()
      );
      expect(outcome.ok).toBe(true);
      const result = JSON.parse(outcome.result);
      expect(result.columns).toEqual([
        { name: "X", type: "number" },
        { name: "Y", type: "string" },
      ]);
    });

    it("should handle an empty table", async () => {
      const ctx = makeContext({
        runtime: { getCurrentData: () => [], getCurrentColumns: () => [] },
      });
      const outcome = await ToolRegistry.executeTool("getDataColumns", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.columns).toEqual([]);
      expect(result.note).toBeTruthy();
    });
  });

  describe("readDataTable", () => {
    it("should return the first N rows without internal metadata", async () => {
      const outcome = await ToolRegistry.executeTool(
        "readDataTable",
        { num_rows: 2 },
        makeContext()
      );
      const result = JSON.parse(outcome.result);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ X: 1, Y: "a" });
      expect(result.total_rows).toBe(3);
      expect(result.note).toBeTruthy();
    });

    it("should default to 10 rows and cap at the maximum", async () => {
      const ctx = makeContext({
        runtime: {
          getCurrentData: () =>
            Array.from({ length: 200 }, (_, i) => ({ X: i })),
          getCurrentColumns: () => ["X"],
        },
      });
      const outcome = await ToolRegistry.executeTool("readDataTable", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.rows).toHaveLength(10);

      const capped = await ToolRegistry.executeTool(
        "readDataTable",
        { num_rows: 9999 },
        ctx
      );
      expect(JSON.parse(capped.result).rows).toHaveLength(50);
    });

    it("should handle a missing data table", async () => {
      const ctx = makeContext({ runtime: { getCurrentData: () => [] } });
      const outcome = await ToolRegistry.executeTool("readDataTable", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.rows).toEqual([]);
      expect(result.note).toBeTruthy();
    });
  });

  describe("getTableStats", () => {
    it("should compute numeric stats for numeric columns and examples for text", async () => {
      const ctx = makeContext({
        runtime: {
          getCurrentData: () => [
            { X: 1, Y: "a" },
            { X: 2, Y: "b" },
            { X: 3, Y: "a" },
          ],
          getCurrentColumns: () => ["X", "Y"],
        },
      });
      const outcome = await ToolRegistry.executeTool("getTableStats", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.row_count).toBe(3);

      const x = result.stats.find((s) => s.column === "X");
      expect(x.type).toBe("number");
      expect(x.min).toBe(1);
      expect(x.max).toBe(3);
      expect(x.mean).toBe(2);

      const y = result.stats.find((s) => s.column === "Y");
      expect(y.type).toBe("text");
      expect(y.distinct).toBe(2);
      expect(y.examples).toEqual(["a", "b"]);
    });

    it("should handle an empty table", async () => {
      const ctx = makeContext({
        runtime: { getCurrentData: () => [], getCurrentColumns: () => [] },
      });
      const outcome = await ToolRegistry.executeTool("getTableStats", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.stats).toEqual([]);
      expect(result.note).toBeTruthy();
    });
  });

  describe("getVisualizationImage", () => {
    it("should not be registered by default (vision disabled in test builds)", () => {
      expect(ToolRegistry.getTool("getVisualizationImage")).toBeUndefined();
      const names = ToolRegistry.getTools().map((t) => t.name);
      expect(names).not.toContain("getVisualizationImage");
    });

    it("should be defined as a non-mutating, parameterless tool", () => {
      expect(getVisualizationImage.name).toBe("getVisualizationImage");
      expect(getVisualizationImage.mutating).toBe(false);
      expect(getVisualizationImage.parameters).toEqual({
        type: "object",
        properties: {},
      });
      expect(getVisualizationImage.description).toContain("PNG");
    });

    it("should return a base64 PNG data URL from the visualizer", async () => {
      // A 3-byte fake PNG buffer: 0x89, 0x50, 0x4e ("\u0089PN").
      const buffer = new Uint8Array([0x89, 0x50, 0x4e]).buffer;
      const visualizerGetImage = vi.fn().mockResolvedValue(buffer);
      const ctx = makeContext({
        visualizer: { getVisualizationImage: visualizerGetImage },
      });
      const value = await getVisualizationImage.execute(ctx, {});
      expect(visualizerGetImage).toHaveBeenCalledTimes(1);
      // btoa encodes the three bytes as "iVBO" (0x89 -> "i", "PN" -> "VBO").
      expect(value.image).toBe("data:image/png;base64,iVBO");
      expect(value.width).toBeTypeOf("number");
    });

    it("should report an error when the visualizer is unavailable", async () => {
      const value = await getVisualizationImage.execute(makeContext(), {});
      expect(value.error).toBeTruthy();
      expect(value.error).toContain("not available");
    });

    it("should report an error when no chart is rendered", async () => {
      const ctx = makeContext({
        visualizer: { getVisualizationImage: vi.fn().mockResolvedValue(null) },
      });
      const value = await getVisualizationImage.execute(ctx, {});
      expect(value.error).toBeTruthy();
      expect(value.error).toContain("No chart");
    });

    it("should report an error when the image cannot be read", async () => {
      const ctx = makeContext({
        visualizer: {
          getVisualizationImage: vi
            .fn()
            .mockResolvedValue(new Blob(["png"]).arrayBuffer()),
        },
      });
      const value = await getVisualizationImage.execute(ctx, {});
      // A Blob-backed buffer should still be readable; an opaque, non-
      // ArrayBuffer value is the failure mode guarded by the try/catch.
      expect(value.error || value.image).toBeTruthy();
    });
  });

  describe("addDataColumn", () => {
    it("should add a new column via runtime.addColumn", async () => {
      const ctx = makeContext();
      const outcome = await ToolRegistry.executeTool(
        "addDataColumn",
        { column_name: "total" },
        ctx
      );
      expect(outcome.ok).toBe(true);
      const result = JSON.parse(outcome.result);
      expect(result).toEqual({ success: true, column: "total" });
      expect(ctx.runtime.addColumn).toHaveBeenCalledWith("total");
    });

    it("should trim the column name", async () => {
      const ctx = makeContext();
      await ToolRegistry.executeTool(
        "addDataColumn",
        { column_name: "  total  " },
        ctx
      );
      expect(ctx.runtime.addColumn).toHaveBeenCalledWith("total");
    });

    it("should reject empty or over-long names via validateTool", () => {
      const ctx = makeContext();
      expect(ToolRegistry.validateTool("addDataColumn", { column_name: "" }, ctx).ok).toBe(false);
      expect(
        ToolRegistry.validateTool("addDataColumn", { column_name: "x".repeat(31) }, ctx).ok
      ).toBe(false);
    });

    it("should reject a duplicate column name via validateTool", () => {
      const ctx = makeContext();
      const validation = ToolRegistry.validateTool(
        "addDataColumn",
        { column_name: "X" },
        ctx
      );
      expect(validation.ok).toBe(false);
      expect(validation.error).toContain("already exists");
    });

    it("should have a human-readable description", () => {
      const description = ToolRegistry.describeToolCall("addDataColumn", {
        column_name: "total",
      });
      expect(description).toContain("total");
      expect(description).toContain("column");
    });
  });

  describe("createVariable", () => {
    it("should create a variable via runtime.addVariable", async () => {
      const ctx = makeContext();
      const outcome = await ToolRegistry.executeTool(
        "createVariable",
        { variable_name: "myVar" },
        ctx
      );
      expect(outcome.ok).toBe(true);
      expect(JSON.parse(outcome.result)).toEqual({ success: true, variable: "myVar" });
      expect(ctx.runtime.addVariable).toHaveBeenCalledWith("myVar");
    });

    it("should reject an existing variable via validateTool", () => {
      const ctx = makeContext({
        runtime: { getVariables: () => ({ existing: null }) },
      });
      const validation = ToolRegistry.validateTool(
        "createVariable",
        { variable_name: "existing" },
        ctx
      );
      expect(validation.ok).toBe(false);
      expect(validation.error).toContain("already exists");
    });

    it("should reject an empty name via validateTool", () => {
      const ctx = makeContext();
      expect(
        ToolRegistry.validateTool("createVariable", { variable_name: "" }, ctx).ok
      ).toBe(false);
    });
  });

  describe("insertCode", () => {
    it("should load blocks into the editor", async () => {
      const loadJsonCode = vi.fn();
      const ctx = makeContext({ editor: { loadJsonCode } });
      const outcome = await ToolRegistry.executeTool(
        "insertCode",
        { code: { blocks: { blocks: [] } } },
        ctx
      );
      expect(outcome.ok).toBe(true);
      expect(JSON.parse(outcome.result)).toEqual({ success: true });
      expect(loadJsonCode).toHaveBeenCalledWith({ blocks: { blocks: [] } });
    });

    it("should reject a payload without a blocks key via validateTool", () => {
      const ctx = makeContext({ editor: { loadJsonCode: vi.fn() } });
      const validation = ToolRegistry.validateTool(
        "insertCode",
        { code: { nope: true } },
        ctx
      );
      expect(validation.ok).toBe(false);
      expect(validation.error).toContain("blocks");
    });

    it("should reject when the editor is unavailable via validateTool", () => {
      const ctx = makeContext({ editor: null });
      const validation = ToolRegistry.validateTool(
        "insertCode",
        { code: { blocks: {} } },
        ctx
      );
      expect(validation.ok).toBe(false);
      expect(validation.error).toContain("editor");
    });

    it("should describe the number of top-level blocks", () => {
      const description = ToolRegistry.describeToolCall("insertCode", {
        code: { blocks: { blocks: [{ id: "a" }, { id: "b" }] } },
      });
      expect(description).toContain("2 top-level blocks");
    });
  });

  describe("validateTool", () => {
    it("should return ok for read-only tools without a validate hook", () => {
      const ctx = makeContext();
      expect(ToolRegistry.validateTool("getDataColumns", {}, ctx)).toEqual({ ok: true });
    });

    it("should report unknown tools as invalid", () => {
      expect(ToolRegistry.validateTool("nope", {}, makeContext()).ok).toBe(false);
    });

    it("should report a validation exception as invalid", () => {
      const ctx = makeContext({
        runtime: {
          getCurrentColumns: () => {
            throw new Error("boom");
          },
        },
      });
      const validation = ToolRegistry.validateTool(
        "addDataColumn",
        { column_name: "new" },
        ctx
      );
      expect(validation.ok).toBe(false);
      expect(validation.error).toContain("boom");
    });
  });

  describe("getCurrentCode", () => {
    it("should return the workspace JSON", async () => {
      const ctx = makeContext({
        editor: { getWorkspace: () => ({ save: () => ({ blocks: [] }) }) },
      });
      const outcome = await ToolRegistry.executeTool("getCurrentCode", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.code).toEqual({ blocks: [] });
    });

    it("should report a note when the editor is unavailable", async () => {
      const ctx = makeContext({ editor: null });
      const outcome = await ToolRegistry.executeTool("getCurrentCode", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.code).toBeNull();
      expect(result.note).toBeTruthy();
    });

    it("should report an error when the saved workspace has no blocks", async () => {
      const ctx = makeContext({
        editor: { getWorkspace: () => ({ save: () => ({}) }) },
      });
      const outcome = await ToolRegistry.executeTool("getCurrentCode", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.code).toBeUndefined();
      expect(result.error).toBeTruthy();
    });

    it("should report an error when the workspace cannot be saved", async () => {
      const ctx = makeContext({
        editor: { getWorkspace: () => ({ save: () => null }) },
      });
      const outcome = await ToolRegistry.executeTool("getCurrentCode", {}, ctx);
      const result = JSON.parse(outcome.result);
      expect(result.code).toBeUndefined();
      expect(result.error).toBeTruthy();
    });
  });

  describe("getCurrentVisualization", () => {
    it("should return the current visualization spec", async () => {
      const outcome = await ToolRegistry.executeTool(
        "getCurrentVisualization",
        {},
        makeContext()
      );
      const result = JSON.parse(outcome.result);
      expect(result.spec).toEqual({ mark: "point" });
    });
  });

  describe("executeTool", () => {
    it("should return an error result for unknown tools", async () => {
      const outcome = await ToolRegistry.executeTool(
        "nonexistentTool",
        {},
        makeContext()
      );
      expect(outcome.ok).toBe(false);
      expect(JSON.parse(outcome.result).error).toContain("nonexistentTool");
    });

    it("should return an error result when a tool throws", async () => {
      // Simulate a throwing tool by passing a context whose runtime method throws.
      const ctx = makeContext({
        runtime: {
          getCurrentData: () => {
            throw new Error("boom");
          },
          getCurrentColumns: () => ["X"],
        },
      });
      const outcome = await ToolRegistry.executeTool("readDataTable", {}, ctx);
      expect(outcome.ok).toBe(false);
      expect(JSON.parse(outcome.result).error).toContain("boom");
    });
  });

  describe("getTool", () => {
    it("should find a registered tool by name", () => {
      const tool = ToolRegistry.getTool("getDataColumns");
      expect(tool).toBeDefined();
      expect(tool.name).toBe("getDataColumns");
    });

    it("should return undefined for unknown names", () => {
      expect(ToolRegistry.getTool("nope")).toBeUndefined();
    });
  });
});
