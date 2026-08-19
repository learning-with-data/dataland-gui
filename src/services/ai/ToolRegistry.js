/**
 * Registry of the tools the AI agent can use to inspect and modify the
 * current project state.
 *
 * Each tool has:
 * - `name` / `description`: exposed to the model.
 * - `parameters`: a JSON Schema object for the tool's arguments.
 * - `mutating`: whether executing the tool changes the open project.
 *   Mutating tools require explicit user confirmation before execution; the
 *   agent loop pauses, the UI shows a confirmation card, and only after the
 *   user allows the call does `execute` run.
 * - `validate(ctx, args)`: returns `{ ok: true }` or
 *   `{ ok: false, error }`. Runs before confirmation so the user is never
 *   asked to approve an invalid action.
 * - `describe(name, args)`: returns a short human-readable summary of the
 *   call, shown on the confirmation card (e.g., "add a column called
 *   `total` to the data table").
 * - `execute(ctx, args)`: performs the tool and returns a JSON-serializable
 *   result (or a promise of one). `ctx` is the AI tool context created by
 *   Gui: `{ runtime, editor, microworld }`.
 */

/**
 * Caps the number of rows `readDataTable` can return, so a large dataset
 * never blows up the model's context window.
 */
const MAX_READ_ROWS = 50;
const DEFAULT_READ_ROWS = 10;

// Width (in CSS pixels) to rasterize the visualization at for the vision
// tool. Small enough to keep the image payload modest, large enough that
// chart labels remain legible to the model.
const VISION_IMAGE_WIDTH = 800;

// The vision tool returns an image the model must be able to see. It is only
// registered when vision support is enabled for the build, so the model is
// never offered a tool whose result it cannot interpret.
const VISION_ENABLED = import.meta.env.VITE_AI_VISION === "true";

const readDataTable = {
  name: "readDataTable",
  description:
    "Reads up to N rows of the current data table. Returns the rows as an " +
    "array of objects keyed by column name. Use this to inspect actual data " +
    "values when answering questions about the dataset.",
  parameters: {
    type: "object",
    properties: {
      num_rows: {
        type: "number",
        description:
          `Number of rows to read (default ${DEFAULT_READ_ROWS}, maximum ${MAX_READ_ROWS}).`,
      },
    },
  },
  mutating: false,
  execute(ctx, args) {
    const data = ctx.runtime.getCurrentData();
    if (!data || data.length === 0) {
      return { rows: [], note: "No data is currently loaded." };
    }
    const num = Math.min(
      Math.max(1, Math.floor(Number(args.num_rows) || DEFAULT_READ_ROWS)),
      MAX_READ_ROWS
    );
    const columns = ctx.runtime.getCurrentColumns();
    // Strip internal metadata fields (keys starting with "__") so the model
    // only sees real columns.
    const rows = data.slice(0, num).map((row) => {
      const clean = {};
      for (const col of columns) {
        clean[col] = row[col];
      }
      return clean;
    });
    return {
      rows,
      total_rows: data.length,
      note:
        rows.length < data.length
          ? `Showing the first ${rows.length} of ${data.length} rows.`
          : undefined,
    };
  },
};

const getDataColumns = {
  name: "getDataColumns",
  description:
    "Lists the names and types of all columns in the current data table. " +
    "Use this to learn what fields are available before asking questions " +
    "about the data or generating code that references columns.",
  parameters: { type: "object", properties: {} },
  mutating: false,
  execute(ctx) {
    const columns = ctx.runtime.getCurrentColumns();
    if (columns.length === 0) {
      return { columns: [], note: "No data is currently loaded." };
    }
    const data = ctx.runtime.getCurrentData();
    const sample = data.length > 0 ? data[0] : null;
    return {
      columns: columns.map((name) => ({
        name,
        type: sample && sample[name] !== undefined
          ? typeof sample[name]
          : "unknown",
      })),
    };
  },
};

const getTableStats = {
  name: "getTableStats",
  description:
    "Computes a compact statistical summary of the current data table: for " +
    "each column, the inferred type, number of distinct values, and for " +
    "numeric columns min/mean/max (rounded). Use this to reason about the " +
    "shape of the data without reading every row.",
  parameters: { type: "object", properties: {} },
  mutating: false,
  execute(ctx) {
    const data = ctx.runtime.getCurrentData();
    const columns = ctx.runtime.getCurrentColumns();
    if (!data || data.length === 0 || columns.length === 0) {
      return { stats: [], note: "No data is currently loaded." };
    }

    const round2 = (n) => Math.round(n * 100) / 100;

    const stats = columns.map((col) => {
      const values = data.map((row) => row[col]);
      const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
      const distinct = new Set(nonNull.map((v) => String(v))).size;
      const entry = {
        column: col,
        non_null: nonNull.length,
        total: values.length,
        distinct: distinct,
      };

      const numeric = nonNull.filter((v) => typeof v === "number" && !isNaN(v));
      if (numeric.length > 0 && numeric.length >= nonNull.length * 0.5) {
        entry.type = "number";
        entry.min = round2(Math.min(...numeric));
        entry.max = round2(Math.max(...numeric));
        entry.mean = round2(
          numeric.reduce((a, b) => a + b, 0) / numeric.length
        );
      } else {
        entry.type = "text";
        // Show a few example values for categorical columns.
        const examples = [...new Set(nonNull.map((v) => String(v)))].slice(0, 5);
        if (examples.length > 0) entry.examples = examples;
      }
      return entry;
    });

    return { row_count: data.length, stats };
  },
};

const getCurrentCode = {
  name: "getCurrentCode",
  description:
    "Returns the Blockly workspace JSON of the code currently in the editor. " +
    "Use this to answer questions about what the current project code does.",
  parameters: { type: "object", properties: {} },
  mutating: false,
  execute(ctx) {
    if (!ctx.editor || !ctx.editor.getWorkspace) {
      return { code: null, note: "The editor is not available." };
    }
    const workspace = ctx.editor.getWorkspace();
    const code = workspace.save();
    if (!code || typeof code !== "object" || !code.blocks) {
      // A saved workspace without blocks is a malformed result; report it as
      // an error so the model is told the tool failed rather than given a
      // useless empty payload.
      return {
        error:
          "The editor reported no code, or its workspace could not be " +
          "saved. Please ask the user to retry.",
      };
    }
    return { code };
  },
};

const getCurrentVisualization = {
  name: "getCurrentVisualization",
  description:
    "Returns the current visualization specification (a Vega-Lite spec) " +
    "describing the chart that is (or will be) displayed. Use this to " +
    "explain or reason about the current visualization.",
  parameters: { type: "object", properties: {} },
  mutating: false,
  execute(ctx) {
    return { spec: ctx.runtime.getVisualizationSpec() };
  },
};

// Exported (in addition to the registry) so unit tests can exercise the
// tool's execute() branches even when vision is disabled for the test build.
export const getVisualizationImage = {
  name: "getVisualizationImage",
  description:
    "Returns a PNG image of the chart currently displayed in the " +
    "visualization panel. Use this to see what the user is actually looking " +
    "at (for example, to answer questions about how the chart looks) instead " +
    "of inferring its appearance from the Vega-Lite spec.",
  parameters: { type: "object", properties: {} },
  mutating: false,
  async execute(ctx) {
    const visualizer = ctx.visualizer;
    if (!visualizer || typeof visualizer.getVisualizationImage !== "function") {
      return {
        error:
          "The visualization panel is not available right now. Use " +
          "getCurrentVisualization to reason about the chart from its spec.",
      };
    }
    const buffer = await visualizer.getVisualizationImage();
    if (!buffer) {
      return {
        error:
          "No chart is currently rendered (it may not have been generated " +
          "yet, or it is not a plot-type visualization). Use " +
          "getCurrentVisualization to reason about the chart from its spec.",
      };
    }
    let bytes;
    try {
      bytes = new Uint8Array(buffer);
    } catch (e) {
      return { error: `Could not read the chart image: ${e.message}` };
    }
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return {
      image: `data:image/png;base64,${btoa(binary)}`,
      width: VISION_IMAGE_WIDTH,
    };
  },
};

//
// Mutating tools. Each changes the open project and therefore only runs
// after the user explicitly confirms the call in the chat UI.
//

const MAX_IDENTIFIER_LENGTH = 30;

const isValidIdentifier = (name) =>
  typeof name === "string" &&
  name.trim().length > 0 &&
  name.trim().length <= MAX_IDENTIFIER_LENGTH;

const addDataColumn = {
  name: "addDataColumn",
  description:
    "Adds a new, empty column to the current data table. Use this when the " +
    "user asks for a new column (e.g. to hold computed values). The column " +
    "is created empty; filling it in later requires Blockly code. Requires " +
    "user confirmation before it runs.",
  parameters: {
    type: "object",
    properties: {
      column_name: {
        type: "string",
        description:
          `Name of the new column (1-${MAX_IDENTIFIER_LENGTH} characters, ` +
          "must not already exist).",
      },
    },
    required: ["column_name"],
  },
  mutating: true,
  validate(ctx, args) {
    const name = args && args.column_name;
    if (!isValidIdentifier(name)) {
      return {
        ok: false,
        error:
          "Invalid column name: it must be a non-empty string of at most " +
          `${MAX_IDENTIFIER_LENGTH} characters.`,
      };
    }
    if (ctx.runtime.getCurrentColumns().includes(name.trim())) {
      return {
        ok: false,
        error: `A column named "${name.trim()}" already exists.`,
      };
    }
    return { ok: true };
  },
  describe() {
    return (args) =>
      `add a column named \`${args.column_name}\` to the data table`;
  },
  execute(ctx, args) {
    ctx.runtime.addColumn(args.column_name.trim());
    return { success: true, column: args.column_name.trim() };
  },
};

const createVariable = {
  name: "createVariable",
  description:
    "Creates a new project variable with an initial value of null. Use this " +
    "when the user asks for a new variable. Requires user confirmation " +
    "before it runs.",
  parameters: {
    type: "object",
    properties: {
      variable_name: {
        type: "string",
        description:
          `Name of the new variable (1-${MAX_IDENTIFIER_LENGTH} characters, ` +
          "must not already exist).",
      },
    },
    required: ["variable_name"],
  },
  mutating: true,
  validate(ctx, args) {
    const name = args && args.variable_name;
    if (!isValidIdentifier(name)) {
      return {
        ok: false,
        error:
          "Invalid variable name: it must be a non-empty string of at most " +
          `${MAX_IDENTIFIER_LENGTH} characters.`,
      };
    }
    if (Object.prototype.hasOwnProperty.call(ctx.runtime.getVariables(), name.trim())) {
      return {
        ok: false,
        error: `A variable named "${name.trim()}" already exists.`,
      };
    }
    return { ok: true };
  },
  describe() {
    return (args) => `create a variable named \`${args.variable_name}\``;
  },
  execute(ctx, args) {
    ctx.runtime.addVariable(args.variable_name.trim());
    return { success: true, variable: args.variable_name.trim() };
  },
};

const insertCode = {
  name: "insertCode",
  description:
    "Loads Blockly blocks into the editor, replacing its current contents. " +
    "Prefer returning fenced block JSON in your answer for new code; use " +
    "this tool when the user explicitly asks to apply code to the editor. " +
    "Requires user confirmation before it runs.",
  parameters: {
    type: "object",
    properties: {
      code: {
        type: "object",
        description:
          "Blockly workspace JSON (compatible with " +
          "Blockly.serialization.workspaces.load) to load into the editor.",
      },
    },
    required: ["code"],
  },
  mutating: true,
  validate(ctx, args) {
    const code = args && args.code;
    if (!code || typeof code !== "object" || Array.isArray(code) || !code.blocks) {
      return {
        ok: false,
        error:
          "Invalid code payload: expected a Blockly workspace JSON object " +
          "with a top-level \"blocks\" key.",
      };
    }
    if (!ctx.editor || !ctx.editor.loadJsonCode) {
      return { ok: false, error: "The editor is not available right now." };
    }
    return { ok: true };
  },
  describe() {
    return (args) => {
      const blocks =
        args.code && args.code.blocks && Array.isArray(args.code.blocks.blocks)
          ? args.code.blocks.blocks.length
          : 0;
      return `insert ${blocks} top-level block${blocks === 1 ? "" : "s"} into the editor (replacing the current code)`;
    };
  },
  execute(ctx, args) {
    ctx.editor.loadJsonCode(args.code);
    return { success: true };
  },
};

/**
 * The set of tools available to the AI agent, in the order they should be
 * presented to the model. The vision tool is included only when vision
 * support is enabled for the build (see VISION_ENABLED above).
 */
const tools = [
  getDataColumns,
  readDataTable,
  getTableStats,
  getCurrentCode,
  getCurrentVisualization,
  ...(VISION_ENABLED ? [getVisualizationImage] : []),
  addDataColumn,
  createVariable,
  insertCode,
];

export const ToolRegistry = {
  /**
   * All registered tools.
   * @returns {Array} The tool definitions.
   */
  getTools() {
    return tools;
  },

  /**
   * Finds a registered tool by name.
   * @param {string} name The tool's name.
   * @returns {Object|undefined} The tool definition, if registered.
   */
  getTool(name) {
    return tools.find((t) => t.name === name);
  },

  /**
   * Serializes the registered tools into the OpenAI `tools` request format.
   * @returns {Array} Tool definitions for the chat completions request.
   */
  toOpenAITools() {
    return tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  },

  /**
   * Validates the arguments for a tool call against the current project
   * state (without executing it).
   *
   * @param {string} name The tool name.
   * @param {Object} args Parsed arguments.
   * @param {Object} ctx The AI tool context.
   * @returns {{ok: boolean, error?: string}} `{ ok: true }` when the call
   *   can be executed meaningfully, or `{ ok: false, error }` with a
   *   human-readable reason.
   */
  validateTool(name, args, ctx) {
    const tool = ToolRegistry.getTool(name);
    if (!tool) {
      return { ok: false, error: `Unknown tool: ${name}` };
    }
    if (!tool.validate) {
      return { ok: true };
    }
    try {
      return tool.validate(ctx, args || {});
    } catch (e) {
      return { ok: false, error: `Validation failed: ${e.message}` };
    }
  },

  /**
   * Produces a short human-readable description of a tool call, for the
   * confirmation card in the chat UI.
   *
   * @param {string} name The tool name.
   * @param {Object} args Parsed arguments.
   * @returns {string} e.g. "add a column named `total` to the data table".
   */
  describeToolCall(name, args) {
    const tool = ToolRegistry.getTool(name);
    if (tool && tool.describe) {
      return tool.describe(name)(args || {});
    }
    return `run ${name}`;
  },

  /**
   * Executes a tool call and normalizes the outcome so the caller can always
   * treat the result as a string for the `tool` role message.
   *
   * @param {string} name The tool name from the model's tool call.
   * @param {Object} args Parsed arguments for the call.
   * @param {Object} ctx The AI tool context `{ runtime, editor, microworld }`.
   * @returns {{ok: boolean, result: string}} A normalized result. `result`
   *   is JSON text; `ok` is false when the tool is unknown or threw.
   */
  async executeTool(name, args, ctx) {
    const tool = ToolRegistry.getTool(name);
    if (!tool) {
      return {
        ok: false,
        result: JSON.stringify({ error: `Unknown tool: ${name}` }),
      };
    }
    try {
      const value = await tool.execute(ctx, args || {});
      return { ok: true, result: JSON.stringify(value) };
    } catch (e) {
      return {
        ok: false,
        result: JSON.stringify({ error: `Tool ${name} failed: ${e.message}` }),
      };
    }
  },
};
