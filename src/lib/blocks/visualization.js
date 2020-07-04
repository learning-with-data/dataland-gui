import Blockly from "scratch-blocks";

function VisualizationBlocks(store) {
  var blocks = {};

  function generate_columns() {
    const state = store.getState();
    if (state.projectDataState.columns.length === 0) {
      return [["Row #", "Row #"]];
    } else {
      return state.projectDataState.columns.map((x) => [x.text, x.text]);
    }
  }

  blocks["visualization_get_menu"] = {
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
        colour: Blockly.Colours.pen.secondary,
        colourSecondary: Blockly.Colours.pen.secondary,
        colourTertiary: Blockly.Colours.pen.tertiary,
        outputShape: Blockly.OUTPUT_SHAPE_ROUND,
      });
    },
  };

  blocks["visualization_set_color"] = {
    init: function () {
      this.jsonInit({
        message0: "set drawing color to %1",
        args0: [
          {
            type: "input_value",
            name: "COLOR",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories.pen,
        colour: Blockly.Colours.pen.primary,
        colourSecondary: Blockly.Colours.pen.secondary,
        colourTertiary: Blockly.Colours.pen.tertiary,
      });
    },
  };

  blocks["visualization_set_title"] = {
    init: function () {
      this.jsonInit({
        message0: "set visualization title to %1",
        args0: [
          {
            type: "input_value",
            name: "STRING",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories.pen,
        colour: Blockly.Colours.pen.primary,
        colourSecondary: Blockly.Colours.pen.secondary,
        colourTertiary: Blockly.Colours.pen.tertiary,
      });
    },
  };

  blocks["visualization_scatterplot"] = {
    init: function () {
      this.jsonInit({
        message0: "draw scatter-plot of %1 and %2",
        args0: [
          {
            type: "input_value",
            name: "COLUMN1",
          },
          {
            type: "input_value",
            name: "COLUMN2",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories.pen,
        colour: Blockly.Colours.pen.primary,
        colourSecondary: Blockly.Colours.pen.secondary,
        colourTertiary: Blockly.Colours.pen.tertiary,
      });
    },
  };

  blocks["visualization_clear"] = {
    init: function () {
      this.jsonInit({
        message0: "clear visualization",
        previousStatement: null,
        nextStatement: null,
        category: Blockly.Categories.pen,
        colour: Blockly.Colours.pen.primary,
        colourSecondary: Blockly.Colours.pen.secondary,
        colourTertiary: Blockly.Colours.pen.tertiary,
      });
    },
  };

  return blocks;
}

export default VisualizationBlocks;
