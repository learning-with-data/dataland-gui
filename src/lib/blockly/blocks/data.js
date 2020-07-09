import Blockly from "blockly/core";

import {
  BLOCKARG_DATA_BOOLEAN,
  BLOCKARG_DATA_COLUMN,
  BLOCKARG_DATA_COMPARISON_OPERATOR,
  BLOCKARG_DATA_MATCH,
  BLOCKARG_DATA_SETVALUE,
  BLOCKDROPDOWN_BOOLEAN,
  BLOCKDROPDOWN_COMPARISON,
} from "../constants";


const ADD_ICON =
  "data:image/svg+xml;charset=utf-8;base64,PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjF" +
  "lbSIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSIjRjVGNUY1IiB4bWxucz0iaHR0cDovL3d3dy" +
  "53My5vcmcvMjAwMC9zdmciPg0KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDMuN" +
  "WEuNS41IDAgMCAxIC41LjV2NGEuNS41IDAgMCAxLS41LjVINGEuNS41IDAgMCAxIDAtMWgzLjVW" +
  "NGEuNS41IDAgMCAxIC41LS41eiIvPg0KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0" +
  "3LjUgOGEuNS41IDAgMCAxIC41LS41aDRhLjUuNSAwIDAgMSAwIDFIOC41VjEyYS41LjUgMCAwID" +
  "EtMSAwVjh6Ii8+DQogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTggMTVBNyA3IDAgM" +
  "SAwIDggMWE3IDcgMCAwIDAgMCAxNHptMCAxQTggOCAwIDEgMCA4IDBhOCA4IDAgMCAwIDAgMTZ6" +
  "Ii8+DQo8L3N2Zz4=";

const REMOVE_ICON =
  "data:image/svg+xml;charset=utf-8;base64,PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjF" +
  "lbSIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSIjRjVGNUY1IiB4bWxucz0iaHR0cDovL3d3dy" +
  "53My5vcmcvMjAwMC9zdmciPg0KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDE1Q" +
  "TcgNyAwIDEgMCA4IDFhNyA3IDAgMCAwIDAgMTR6bTAgMUE4IDggMCAxIDAgOCAwYTggOCAwIDAg" +
  "MCAwIDE2eiIvPg0KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zLjUgOGEuNS41IDA" +
  "gMCAxIC41LS41aDhhLjUuNSAwIDAgMSAwIDFINGEuNS41IDAgMCAxLS41LS41eiIvPg0KPC9zdmc+";

const ICON_SIZE = 25;

function DataBlocks(store) {
  var blocks = {};

  function generate_columns() {
    // return [["Row #", "Row #"]];
    const state = store.getState();
    if (state.projectDataState.columns.length === 0) {
      return [["Row #", "Row #"]];
    } else {
      return state.projectDataState.columns.map((x) => [x.text, x.text]);
    }
  }

  blocks["data_row_count"] = {
    init: function () {
      this.jsonInit({
        message0: "number of rows",
        inputsInline: true,
        output: "Number",
        style: "data_blocks",
      });
    },
  };

  blocks["data_get"] = {
    init: function () {
      this.jsonInit({
        message0: "%1 of selected row",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_DATA_COLUMN,
            options: generate_columns,
          },
        ],
        inputsInline: true,
        output: "String",
        style: "data_blocks",
      });
    },
  };

  blocks["data_set"] = {
    init: function() {
      this.jsonInit({
        message0: "set %1 of selected row to %2",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_DATA_COLUMN,
            options: generate_columns,
          },
          {
            name: BLOCKARG_DATA_SETVALUE,
            type: "field_input",
            text: "Value"
          }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "data_blocks",
      });
    },
  },

  blocks["data_select_next"] = {
    init: function () {
      this.jsonInit({
        message0: "select next row",
        args0: [],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "data_blocks",
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
            type: "field_dropdown",
            name: BLOCKARG_DATA_COLUMN + 0,
            options: generate_columns,
          },
          {
            type: "field_dropdown",
            name: BLOCKARG_DATA_COMPARISON_OPERATOR + 0,
            options: BLOCKDROPDOWN_COMPARISON,
          },
          {
            type: "field_input",
            name: BLOCKARG_DATA_MATCH + 0,
            text: "condition 1",
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
        mutator: "data_filter_mutator",
        style: "data_blocks",
      });
    },
  };

  // Mutator code below based on
  // https://github.com/google/blockly-samples/tree/master/plugins/block-plus-minus

  const dataFilterMutator = {
    hasAdditionalCondition: false,

    mutationToDom: function () {
      const container = Blockly.utils.xml.createElement("mutation");
      container.setAttribute(
        "hasAdditionalCondition",
        this.hasAdditionalCondition
      );
      return container;
    },

    domToMutation: function (xmlElement) {
      const hasAdditionalCondition =
        xmlElement.getAttribute("hasAdditionalCondition") === "true";
      if (hasAdditionalCondition) this.addCondition();
    },

    plus: function () {
      this.addCondition();
    },

    minus: function () {
      this.removeCondition();
    },

    addCondition: function () {
      const inputRow1 = this.inputList[0];
      inputRow1
        .appendField(
          new Blockly.FieldDropdown(BLOCKDROPDOWN_BOOLEAN),
          BLOCKARG_DATA_BOOLEAN + 0
        )
        .appendField(
          new Blockly.FieldDropdown(generate_columns),
          BLOCKARG_DATA_COLUMN + 1
        )
        .appendField(
          new Blockly.FieldDropdown(BLOCKDROPDOWN_COMPARISON),
          BLOCKARG_DATA_COMPARISON_OPERATOR + 1
        )
        .appendField(
          new Blockly.FieldTextInput("condition 2"),
          BLOCKARG_DATA_MATCH + 1
        )
        .appendField(
          new Blockly.FieldImage(
            REMOVE_ICON,
            ICON_SIZE,
            ICON_SIZE,
            "-",
            onMinusClicked
          ),
          "REMOVE"
        )
        .removeField("ADD");
      this.hasAdditionalCondition = true;
    },

    removeCondition: function () {
      const inputRow1 = this.inputList[0];

      inputRow1.removeField("REMOVE");
      inputRow1.removeField(BLOCKARG_DATA_MATCH + 1);
      inputRow1.removeField(BLOCKARG_DATA_COMPARISON_OPERATOR + 1);
      inputRow1.removeField(BLOCKARG_DATA_COLUMN + 1);
      inputRow1.removeField(BLOCKARG_DATA_BOOLEAN + 0);

      inputRow1.appendField(
        new Blockly.FieldImage(
          ADD_ICON,
          ICON_SIZE,
          ICON_SIZE,
          "+",
          onPlusClicked
        ),
        "ADD"
      );

      this.hasAdditionalCondition = false;
    },
  };

  const dataFilterHelper = function () {
    const inputRow1 = this.inputList[0];
    inputRow1.appendField(
      new Blockly.FieldImage(
        ADD_ICON,
        ICON_SIZE,
        ICON_SIZE,
        "+",
        onPlusClicked
      ),
      "ADD"
    );
  };

  const onPlusClicked = function (field) {
    mutate(field, true);
  };

  const onMinusClicked = function (field) {
    mutate(field, false);
  };

  const mutate = function (field, add) {
    const block = field.getSourceBlock();

    Blockly.Events.setGroup(true);

    const oldMutationDom = block.mutationToDom();
    const oldMutation = oldMutationDom && Blockly.Xml.domToText(oldMutationDom);

    if (add) {
      block.plus();
    } else {
      block.minus();
    }

    const newMutationDom = block.mutationToDom();
    const newMutation = newMutationDom && Blockly.Xml.domToText(newMutationDom);

    if (oldMutation != newMutation) {
      Blockly.Events.fire(
        new Blockly.Events.BlockChange(
          block,
          "mutation",
          null,
          oldMutation,
          newMutation
        )
      );
    }
    Blockly.Events.setGroup(false);
  };

  Blockly.Extensions.unregister("data_filter_mutator");
  Blockly.Extensions.registerMutator(
    "data_filter_mutator",
    dataFilterMutator,
    dataFilterHelper
  );

  return blocks;
}

export default DataBlocks;
