import { describe, it, expect, beforeAll } from "vitest";
import { registerFieldColour } from "@blockly/field-colour";
import { BlockSpecExtractor } from "../../src/services/ai/BlockSpecExtractor";

// Import the block definitions so they get registered with Blockly.Blocks.
import "../../src/lib/blockly/blocks";

// Register the field_colour field so blocks that use it can be instantiated.
registerFieldColour();

describe("BlockSpecExtractor", () => {
  let spec;

  beforeAll(() => {
    spec = BlockSpecExtractor.extractAll();
  });

  it("should extract specs for registered blocks", () => {
    expect(Object.keys(spec).length).toBeGreaterThan(0);
  });

  it("should correctly classify input_value arguments", () => {
    // debug_log has an input_value argument MESSAGE
    expect(spec["debug_log"]).toBeDefined();
    expect(spec["debug_log"]["MESSAGE"].type).toBe("input_value");

    // visualization_set_title has an input_value argument TITLE
    expect(spec["visualization_set_title"]).toBeDefined();
    expect(spec["visualization_set_title"]["TITLE"].type).toBe("input_value");

    // control_repeat has an input_value argument TIMES
    expect(spec["control_repeat"]).toBeDefined();
    expect(spec["control_repeat"]["TIMES"].type).toBe("input_value");
  });

  it("should correctly classify field_dropdown arguments", () => {
    // visualization_set_mark has a field_dropdown argument MARK
    expect(spec["visualization_set_mark"]).toBeDefined();
    expect(spec["visualization_set_mark"]["MARK"].type).toBe("field_dropdown");

    // operator_arithmetic has a field_dropdown argument OP
    expect(spec["operator_arithmetic"]).toBeDefined();
    expect(spec["operator_arithmetic"]["OP"].type).toBe("field_dropdown");
  });

  it("should capture the valid option values for field_dropdown arguments", () => {
    // data_filter's COMPARISON_OPERATOR0 is a dropdown whose valid values are
    // "eq", "neq", etc. (not symbols like "=="). The AI must be told the
    // exact values or Blockly rejects the field at render time.
    expect(spec["data_filter"]).toBeDefined();
    expect(spec["data_filter"]["COMPARISON_OPERATOR0"].type).toBe("field_dropdown");
    const ops = spec["data_filter"]["COMPARISON_OPERATOR0"].options;
    expect(ops).toBeDefined();
    expect(ops).toContain("eq");
    expect(ops).not.toContain("==");

    // visualization_set_mark's MARK options should include the mark types.
    const marks = spec["visualization_set_mark"]["MARK"].options;
    expect(marks).toBeDefined();
    expect(marks).toContain("point");
  });

  it("should correctly classify dynamic_dropdown arguments", () => {
    // visualization_set_x has a dynamic dropdown COLUMN argument
    expect(spec["visualization_set_x"]).toBeDefined();
    expect(spec["visualization_set_x"]["COLUMN"].type).toBe("dynamic_dropdown");

    // visualization_set_y has a dynamic dropdown COLUMN argument
    expect(spec["visualization_set_y"]).toBeDefined();
    expect(spec["visualization_set_y"]["COLUMN"].type).toBe("dynamic_dropdown");

    // data_get has a dynamic dropdown COLUMN argument
    expect(spec["data_get"]).toBeDefined();
    expect(spec["data_get"]["COLUMN"].type).toBe("dynamic_dropdown");
  });

  it("should correctly classify field_input arguments", () => {
    // text block has a field_input argument TEXT
    expect(spec["text"]).toBeDefined();
    expect(spec["text"]["TEXT"].type).toBe("field_input");
  });

  it("should classify math_number's NUM as a field_input (type-agnostic value block)", () => {
    // math_number deliberately uses a field_input (not a field_number) so the
    // user can type any value - including non-numeric text - into a
    // math_number slot. The block language is type-agnostic, and the
    // type-aware comparison happens at runtime (see DataTable.pushFilter).
    expect(spec["math_number"]).toBeDefined();
    expect(spec["math_number"]["NUM"].type).toBe("field_input");
  });

  it("should correctly classify field_colour arguments", () => {
    // colour_picker has a field_colour argument COLOUR
    expect(spec["colour_picker"]).toBeDefined();
    expect(spec["colour_picker"]["COLOUR"].type).toBe("field_colour");
  });

  it("should correctly classify field_variable arguments", () => {
    // variables_get has a field_variable argument (VAR)
    expect(spec["variables_get"]).toBeDefined();
    expect(spec["variables_get"]["VAR"].type).toBe("field_variable");

    // variables_set has a field_variable argument (VAR)
    expect(spec["variables_set"]).toBeDefined();
    expect(spec["variables_set"]["VAR"].type).toBe("field_variable");
  });

  it("should correctly classify input_statement arguments", () => {
    // control_if has an input_statement argument SUBSTACK
    expect(spec["control_if"]).toBeDefined();
    expect(spec["control_if"]["SUBSTACK"].type).toBe("input_statement");

    // control_repeat has an input_statement argument SUBSTACK
    expect(spec["control_repeat"]).toBeDefined();
    expect(spec["control_repeat"]["SUBSTACK"].type).toBe("input_statement");
  });

  it("should not include blocks with no arguments", () => {
    // event_onprojectstart has no arguments
    expect(spec["event_onprojectstart"]).toBeUndefined();

    // visualization_clear has no arguments
    expect(spec["visualization_clear"]).toBeUndefined();

    // data_select_next has no arguments
    expect(spec["data_select_next"]).toBeUndefined();
  });

  it("should format specs for the prompt", () => {
    const formatted = BlockSpecExtractor.formatForPrompt(spec);
    expect(formatted).toContain("Blocks with input_value arguments");
    expect(formatted).toContain("debug_log: MESSAGE");
    expect(formatted).toContain("Blocks with field arguments");
    expect(formatted).toContain("Blocks with dynamic dropdown arguments");
    expect(formatted).toContain("visualization_set_x: COLUMN");
  });

  it("should include dropdown option values in the formatted prompt", () => {
    const formatted = BlockSpecExtractor.formatForPrompt(spec);
    // data_filter's comparison operator must be annotated with its valid
    // values so the AI emits "eq" rather than "==".
    expect(formatted).toContain("COMPARISON_OPERATOR0 (value =");
    expect(formatted).toContain("\"eq\"");
    // visualization_set_mark's MARK should list its valid mark types.
    expect(formatted).toContain("MARK (value =");
    expect(formatted).toContain("\"point\"");
  });

  it("should handle blocks that fail to introspect gracefully", () => {
    // This is a defensive test - some blocks may fail to instantiate
    // in a headless environment. The extractor should not throw.
    expect(() => BlockSpecExtractor.extractAll()).not.toThrow();
  });
});
