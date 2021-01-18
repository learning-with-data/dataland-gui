import * as Blockly from "blockly/core";
import En from "blockly/msg/en";
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

function getCustomBlockly(microworld, getColumnsFunc) {
  const generate_data_columns = function () {
    const columns = getColumnsFunc();
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

  // Monkey-patch to enable shadow blocks for variable_set input for now
  //
  // Based on the instructions at:
  // https://developers.google.com/blockly/guides/configure/web/toolbox#dynamic_categories
  // and the existing flyout callback at blockly/core/variables.js in Blockly
  Blockly.Variables.flyoutCategoryBlocks = function (workspace) {
    var variableModelList = workspace.getVariablesOfType("");

    var xmlList = [];
    if (variableModelList.length > 0) {
      var mostRecentVariable = variableModelList[variableModelList.length - 1];
      if (Blockly.Blocks["variables_set"]) {
        var set_block = Blockly.utils.xml.createElement("block");
        set_block.setAttribute("type", "variables_set");
        set_block.setAttribute("id", "variables_set");
        set_block.setAttribute("gap", 8);
        const shadowValue = Blockly.Xml.textToDom(
          `
          <value name="${BLOCKARG_VARIABLE_VALUE}">
            <shadow type="text">
              <field name="TEXT"></field>
            </shadow>
          </value>
          `
        );
        set_block.appendChild(shadowValue);
        set_block.appendChild(
          Blockly.Variables.generateVariableFieldDom(mostRecentVariable)
        );
        xmlList.push(set_block);
      }
      if (Blockly.Blocks["variables_get"]) {
        variableModelList.sort(Blockly.VariableModel.compareByName);
        for (var i = 0, variable; (variable = variableModelList[i]); i++) {
          var get_block = Blockly.utils.xml.createElement("block");
          get_block.setAttribute("type", "variables_get");
          get_block.setAttribute("gap", 8);
          get_block.appendChild(
            Blockly.Variables.generateVariableFieldDom(variable)
          );
          xmlList.push(get_block);
        }
      }
    }
    return xmlList;
  };

  return Blockly;
}

export default getCustomBlockly;
