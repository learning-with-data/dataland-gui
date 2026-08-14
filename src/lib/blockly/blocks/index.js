import * as Blockly from "blockly/core";
import * as En from "blockly/msg/en";
Blockly.setLocale(En);

import ControlBlocks from "./control";
import DataBlocks from "./data";
import MapsBlocks from "./maps";
import OperatorBlocks from "./operator";
import VisualizationBlocks from "./visualization";
import VariableBlocks from "./variables";

import DebugBlocks from "./debug";

import { BLOCKARG_VARIABLE_VALUE } from "../constants";

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

const generate_data_columns = function () {
  const thisBlock = this.getSourceBlock();
  let columns = [];
  if (thisBlock !== null) {
    columns = JSON.parse(
      thisBlock.workspace.getInjectionDiv().parentNode.dataset
        .projectdatacolumns
    );
  }

  if (columns && columns.length === 0) {
    return [["Row #", "__visible_id"]];
  } else {
    var menuitems = columns.map((x) => [x, x]);
    menuitems.unshift(["Row #", "__visible_id"]);
    return menuitems;
  }
};

Object.assign(
  Blockly.Blocks,
  standardBlocks,
  ControlBlocks,
  DataBlocks(generate_data_columns),
  MapsBlocks(generate_data_columns),
  OperatorBlocks,
  VisualizationBlocks(generate_data_columns),
  VariableBlocks,
  DebugBlocks
);

// // Extension to get data column names from current workspace's parent
// // This can be used later if generate_data_columns() function above
// // does not work as expected.
// // Note: In order to use this, type: "field_dropdown" in the block
// // definition needs to be changed to type: "input_dummy", along with
// // additional changes, as the field is being created dynamically, as
// // opposed to just the menu, as in generate_data_columns() above.
//
// if (!Blockly.Extensions.isRegistered("get_data_columns_extension")) {
//   Blockly.Extensions.register("get_data_columns_extension", function () {
//     var thisBlock = this;
//     thisBlock.getInput(BLOCKARG_DATA_COLUMN).appendField(
//       new Blockly.FieldDropdown(function () {
//         var columns = JSON.parse(
//           thisBlock.workspace.getInjectionDiv().parentNode.dataset
//             .projectdatacolumns
//         );
//
//         if (columns && columns.length === 0) {
//           return [["Row #", "__visible_id"]];
//         } else {
//           var menuitems = columns.map((x) => [x, x]);
//           menuitems.unshift(["Row #", "__visible_id"]);
//           return menuitems;
//         }
//       }),
//       BLOCKARG_DATA_COLUMN
//     );
//   });
// }

// Monkey-patch to enable shadow blocks for variable_set input for now
//
// Based on the instructions at:
// https://developers.google.com/blockly/guides/configure/web/toolbox#dynamic_categories
// and the existing flyout callback at blockly/core/variables.js in Blockly
const originalGetToolboxCategoryCallback = Blockly.WorkspaceSvg.prototype.getToolboxCategoryCallback;
Blockly.WorkspaceSvg.prototype.getToolboxCategoryCallback = function (key) {
  const callback = originalGetToolboxCategoryCallback.call(this, key);

  if (key === Blockly.Variables.CATEGORY_NAME && callback) {
    return function (workspace) {
      const items = callback(workspace);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "block" && item.type === "variables_set") {
          item.inputs = item.inputs || {};
          item.inputs[BLOCKARG_VARIABLE_VALUE] = {
            shadow: {
              type: "text",
              fields: {
                TEXT: "",
              },
            },
          };
        }
      }
      return items;
    };
  }

  return callback;
};

function initBlockly() {
  // Based on https://github.com/google/blockly-samples/blob/master/plugins/block-test/src/basic.js
  // NOP
}

export default initBlockly;
