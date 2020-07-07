import * as Blockly from "blockly/core";
import En from "blockly/msg/en";
Blockly.setLocale(En);

import ControlBlocks from "./control";
import OperatorBlocks from "./operator";
import DataBlocks from "./data";
import VisualizationBlocks from "./visualization";
import VariableBlocks from "./variables";

import DebugBlocks from "./debug";

const standardBlocks = {
  text: {
    init: function () {
      this.jsonInit({
        type: "text",
        message0: "%1",
        args0: [
          {
            type: "field_input",
            name: "TEXT",
            text: "",
          },
        ],
        output: "String",
      });
    },
  },
  math_number: {
    init: function () {
      this.jsonInit({
        type: "math_number",
        message0: "%1",
        args0: [
          {
            type: "field_number",
            name: "NUM",
            value: 0,
          },
        ],
        output: "Number",
      });
    },
  },
  colour_picker: {
    init: function () {
      this.jsonInit({
        type: "colour_picker",
        message0: "%1",
        args0: [
          {
            type: "field_colour",
            name: "COLOUR",
            colour: "#4B9CD3",
          },
        ],
        output: "Colour",
      });
    },
  },
};

function getCustomBlockly(store) {
  Object.assign(
    Blockly.Blocks,
    standardBlocks,
    ControlBlocks,
    OperatorBlocks,
    DataBlocks(store),
    VisualizationBlocks(store),
    VariableBlocks,
    DebugBlocks
  );

  return Blockly;
}

export default getCustomBlockly;
