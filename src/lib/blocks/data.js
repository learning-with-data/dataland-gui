import Blockly from "scratch-blocks";

function DataBlocks(store) {
  var blocks = {};

  function generate_columns() {
    // return [["Row #", "Row #"]];
    const state = store.getState();
    if (state.projectDataState.columns.length === 0) {
      return [
        ["Row #", "Row #"],
      ];
    } else {
      return state.projectDataState.columns.map((x) => [x.text, x.text]);
    }
  }

  blocks["data_get_menu"] = {
    init: function () {
      this.jsonInit({
        message0: "%1",
        args0: [
          {
            type: "field_dropdown",
            name: "COLUMN",
            options: generate_columns,
          },
        ],
        inputsInline: true,
        output: "String",
        colour: Blockly.Colours.data.secondary,
        colourSecondary: Blockly.Colours.data.secondary,
        colourTertiary: Blockly.Colours.data.tertiary,
        outputShape: Blockly.OUTPUT_SHAPE_ROUND,
      });
    },
  };

  blocks["data_row_count"] = {
    init: function () {
      this.jsonInit({
        message0: "number of rows",
        inputsInline: true,
        output: "Number",
        category: Blockly.Categories.data,
        colour: Blockly.Colours.data.primary,
        colourSecondary: Blockly.Colours.data.secondary,
        colourTertiary: Blockly.Colours.data.tertiary,
        outputShape: Blockly.OUTPUT_SHAPE_ROUND,
      });
    },
  };

  blocks["data_get"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 of selected row",
        args0: [
          {
            type: "input_value",
            name: "COLUMN",
          },
        ],
        inputsInline: true,
        output: "String",
        category: Blockly.Categories.data,
        colour: Blockly.Colours.data.primary,
        colourSecondary: Blockly.Colours.data.secondary,
        colourTertiary: Blockly.Colours.data.tertiary,
        outputShape: Blockly.OUTPUT_SHAPE_ROUND,
      });
    },
  };

  blocks["data_select_next"] = {
    init: function () {
      this.jsonInit({
        message0: "select next row",
        args0: [],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories.data,
        colour: Blockly.Colours.data.primary,
        colourSecondary: Blockly.Colours.data.secondary,
        colourTertiary: Blockly.Colours.data.tertiary,
      });
    },
  };

  blocks["data_filter"] = {
    init: function () {
      this.jsonInit({
        id: "data_filter",
        message0: "with filter %1 %2 %3",
        message1: "%1", // Statement
        lastDummyAlign2: "RIGHT",
        args0: [
          {
            type: "input_value",
            name: "COLUMN",
          },
          {
            type: "field_dropdown",
            name: "COMPARISON_OPERATOR",
            options: [
              ["=", "="],
              [">", ">"],
              ["<", "<"],
              [">=", ">="],
              ["<=", "<="],
            ],
          },
          {
            type: "input_value",
            name: "STRING",
          },
        ],
        args1: [
          {
            type: "input_statement",
            name: "SUBSTACK",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories.data,
        colour: Blockly.Colours.data.primary,
        colourSecondary: Blockly.Colours.data.secondary,
        colourTertiary: Blockly.Colours.data.tertiary,
      });
    },
  };

  return blocks;
}

export default DataBlocks;
