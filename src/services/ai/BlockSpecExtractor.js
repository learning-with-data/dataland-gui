import * as Blockly from "blockly/core";

/**
 * Extracts block argument type specifications by introspecting registered
 * Blockly block definitions using a headless workspace.
 *
 * Returns a map of block type to its argument types, where each argument is
 * classified as either:
 * - "input_value": requires a block connection (use "inputs" in JSON)
 * - "input_statement": requires a statement block (use "inputs" in JSON)
 * - "field_dropdown": requires a field value (use "fields" in JSON)
 * - "field_input": requires a field value (use "fields" in JSON)
 * - "field_number": requires a field value (use "fields" in JSON)
 * - "field_colour": requires a field value (use "fields" in JSON)
 * - "field_variable": requires a field value (use "fields" in JSON)
 * - "dynamic_dropdown": dropdown whose options depend on runtime data
 *   (use "fields" in JSON, options come from dataset)
 */
export const BlockSpecExtractor = {
  /**
   * Extracts argument type specifications for all registered blocks.
   * @returns {Object<string, Object<string, string>>} Map of block type to
   *   map of argument name to argument type.
   */
  extractAll() {
    const spec = {};
    const workspace = new Blockly.Workspace();

    try {
      const blockTypes = Object.keys(Blockly.Blocks);

      for (const type of blockTypes) {
        try {
          const blockSpec = this.extractBlockSpec(type, workspace);
          if (blockSpec) {
            spec[type] = blockSpec;
          }
        } catch (e) {
          // Skip blocks that can't be instantiated (e.g., require special
          // workspace setup or have errors during init).
          console.warn(`BlockSpecExtractor: failed to introspect block "${type}":`, e.message);
        }
      }
    } finally {
      workspace.dispose();
    }

    return spec;
  },

  /**
   * Extracts the argument specification for a single block type.
   * @param {string} type The block type to introspect.
   * @param {Blockly.Workspace} workspace A headless workspace to use.
   * @returns {Object<string, string>|null} Map of argument name to argument
   *   type, or null if the block has no arguments.
   */
  extractBlockSpec(type, workspace) {
    const block = workspace.newBlock(type);

    try {
      const spec = {};

      // Inspect each input and its associated fields.
      for (const input of block.inputList) {
        // Classify the input itself (for input_value and input_statement).
        if (input.name) {
          if (input.type === Blockly.inputs.inputTypes.VALUE) {
            spec[input.name] = { type: "input_value", options: null };
          } else if (input.type === Blockly.inputs.inputTypes.STATEMENT) {
            spec[input.name] = { type: "input_statement", options: null };
          }
        }

        // Inspect fields attached to this input (works for DUMMY, VALUE, and STATEMENT inputs).
        for (const field of input.fieldRow) {
          if (!field.name) continue;

          const fieldType = this.classifyField(field);
          if (fieldType) {
            const options =
              fieldType === "field_dropdown" ? this.getDropdownOptions(field) : null;
            spec[field.name] = { type: fieldType, options };
          }
        }
      }

      return Object.keys(spec).length > 0 ? spec : null;
    } finally {
      block.dispose();
    }
  },

  /**
   * Extracts the list of valid option values for a static FieldDropdown.
   *
   * @param {Blockly.FieldDropdown} field The dropdown field.
   * @returns {string[]|null} Array of option values, or null if the options
   *   could not be determined (e.g. dynamic dropdown or no options).
   */
  getDropdownOptions(field) {
    try {
      const options = field.getOptions(true);
      if (Array.isArray(options) && options.length > 0) {
        // Each option is [displayText, value]. We want the value (index 1),
        // which is what must appear in the JSON "fields" object.
        return options
          .map((opt) => (Array.isArray(opt) ? opt[1] : opt))
          .filter((v) => v !== undefined && v !== null);
      }
    } catch {
      // Options not available in this context.
    }
    return null;
  },

  /**
   * Classifies a Blockly field into a category suitable for the system prompt.
   *
   * Field classification is done via `instanceof` checks against the classes
   * registered in Blockly's field registry (rather than by inspecting the
   * field's constructor name). Constructor names are unreliable because they
   * get minified/obfuscated in the bundled build used by the test environment,
   * whereas the registry always holds the canonical class references.
   *
   * @param {Blockly.Field} field The field to classify.
   * @returns {string|null} The field type classification, or null if unknown.
   */
  classifyField(field) {
    // Look up the canonical field classes from the registry. The registry
    // name for a field type (e.g. "field_input") matches the string used in
    // the block definition's JSON.
    const getRegistryClass = (name) => {
      try {
        return Blockly.registry.getClass(Blockly.registry.Type.FIELD, name);
      } catch {
        return null;
      }
    };

    const FieldDropdown = getRegistryClass("field_dropdown");
    const FieldInput = getRegistryClass("field_input");
    const FieldNumber = getRegistryClass("field_number");
    const FieldColour = getRegistryClass("field_colour");
    const FieldVariable = getRegistryClass("field_variable");

    // Check the most specific subclasses first. FieldColour (extends
    // FieldGridDropdown -> FieldDropdown) and FieldVariable (extends
    // FieldDropdown) are both `instanceof FieldDropdown`, so they must be
    // tested before the general FieldDropdown branch or they would be
    // misclassified.
    if (FieldColour && field instanceof FieldColour) {
      return "field_colour";
    } else if (FieldVariable && field instanceof FieldVariable) {
      return "field_variable";
    } else if (FieldDropdown && field instanceof FieldDropdown) {
      // Check if this is a dynamic dropdown (options depend on workspace data).
      if (this.isDynamicDropdown(field)) {
        return "dynamic_dropdown";
      }
      return "field_dropdown";
    } else if (FieldInput && field instanceof FieldInput) {
      return "field_input";
    } else if (FieldNumber && field instanceof FieldNumber) {
      return "field_number";
    }

    return null;
  },

  /**
   * Determines whether a FieldDropdown is dynamic (its options depend on
   * runtime workspace data, such as the loaded dataset columns).
   *
   * This uses a heuristic: dynamic dropdowns in this codebase use a function
   * (generate_data_columns) that accesses the workspace's parent DOM element
   * to read dataset columns. We detect this by checking if the field's
   * options are a function that references workspace data.
   *
   * @param {Blockly.FieldDropdown} field The field to check.
   * @returns {boolean} True if the dropdown is dynamic.
   */
  isDynamicDropdown(field) {
    // In Blockly, FieldDropdown stores a dynamic options function in the
    // `menuGenerator_` property (set when the field is created with a
    // function as its options, as in generate_data_columns above).
    const generator = field.menuGenerator_;
    if (typeof generator === "function") {
      // Check if the function references workspace data (heuristic).
      const fnStr = generator.toString();
      return (
        fnStr.includes("getInjectionDiv") ||
        fnStr.includes("projectdatacolumns") ||
        fnStr.includes("workspace")
      );
    }
    return false;
  },

  /**
   * Formats the extracted block specs into a human-readable string suitable
   * for inclusion in a system prompt.
   *
   * @param {Object<string, Object<string, string>>} spec The block specs.
   * @returns {string} Formatted documentation string.
   */
  formatForPrompt(spec) {
    const inputBlocks = [];
    const fieldBlocks = [];
    const dynamicBlocks = [];

    for (const [blockType, args] of Object.entries(spec)) {
      const inputArgs = [];
      const fieldArgs = [];
      const dynamicArgs = [];

      for (const [argName, arg] of Object.entries(args)) {
        const argType = arg.type;
        if (argType === "input_value" || argType === "input_statement") {
          inputArgs.push(argName);
        } else if (argType === "dynamic_dropdown") {
          dynamicArgs.push(argName);
        } else {
          // Field argument. If it's a dropdown with known options, annotate
          // the valid values so the AI doesn't invent its own (e.g. "=="
          // instead of "eq"), which Blockly would reject at render time.
          if (arg.options && arg.options.length > 0) {
            const values = arg.options.map((v) => `"${v}"`).join("|");
            fieldArgs.push(`${argName} (value = ${values})`);
          } else {
            fieldArgs.push(argName);
          }
        }
      }

      if (inputArgs.length > 0) {
        inputBlocks.push(`${blockType}: ${inputArgs.join(", ")}`);
      }
      if (fieldArgs.length > 0) {
        fieldBlocks.push(`${blockType}: ${fieldArgs.join(", ")}`);
      }
      if (dynamicArgs.length > 0) {
        dynamicBlocks.push(`${blockType}: ${dynamicArgs.join(", ")} (value = column name from dataset)`);
      }
    }

    const sections = [];

    if (inputBlocks.length > 0) {
      sections.push(
        "#### Blocks with input_value arguments (use \"inputs\"):\n" +
          inputBlocks.map((b) => `- ${b}`).join("\n")
      );
    }

    if (fieldBlocks.length > 0) {
      sections.push(
        "#### Blocks with field arguments (use \"fields\"):\n" +
          fieldBlocks.map((b) => `- ${b}`).join("\n")
      );
    }

    if (dynamicBlocks.length > 0) {
      sections.push(
        "#### Blocks with dynamic dropdown arguments (use \"fields\", value = dataset column name):\n" +
          dynamicBlocks.map((b) => `- ${b}`).join("\n")
      );
    }

    if (sections.length === 0) {
      return "No block argument types could be extracted.";
    }

    return sections.join("\n\n");
  },
};
