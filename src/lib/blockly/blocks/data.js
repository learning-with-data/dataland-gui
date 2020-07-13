import Blockly from "blockly/core";

import {
  BLOCKARG_DATA_BOOLEAN,
  BLOCKARG_DATA_COLUMN,
  BLOCKARG_DATA_COMPARISON_OPERATOR,
  BLOCKARG_DATA_MATCH,
  BLOCKARG_DATA_ROWNUM,
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

function DataBlocks(generate_data_columns) {
  var blocks = {};

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
            options: generate_data_columns,
          },
        ],
        inputsInline: true,
        output: null,
        style: "data_blocks",
      });
    },
  };

  blocks["data_set"] = {
    init: function () {
      this.jsonInit({
        message0: "set %1 of selected row to %2",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_DATA_COLUMN,
            options: generate_data_columns,
          },
          {
            type: "input_value",
            name: BLOCKARG_DATA_SETVALUE,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "data_blocks",
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
        style: "data_blocks",
      });
    },
  };

  blocks["data_select"] = {
    init: function () {
      this.jsonInit({
        message0: "select row # %1",
        args0: [
          {
            type: "input_value",
            name: BLOCKARG_DATA_ROWNUM,
            check: "Number",
          },
        ],
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
        message0: "with filter %1 %2 %3 %4",
        message1: "%1", // Statement
        lastDummyAlign2: "RIGHT",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_DATA_COLUMN + 0,
            options: generate_data_columns,
          },
          {
            type: "field_dropdown",
            name: BLOCKARG_DATA_COMPARISON_OPERATOR + 0,
            options: BLOCKDROPDOWN_COMPARISON,
          },
          {
            type: "input_value",
            name: BLOCKARG_DATA_MATCH + 0,
          },
          {
            // This is needed for the mutator
            // to attach fields later on
            type: "input_dummy",
            name: "DUMMY" + 0,
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
      // First, add a bunch of fields
      const dummyInput0 = this.getInput("DUMMY" + 0);
      dummyInput0
        .appendField(
          new Blockly.FieldDropdown(BLOCKDROPDOWN_BOOLEAN),
          BLOCKARG_DATA_BOOLEAN + 0
        )
        .appendField(
          new Blockly.FieldDropdown(generate_data_columns),
          BLOCKARG_DATA_COLUMN + 1
        )
        .appendField(
          new Blockly.FieldDropdown(BLOCKDROPDOWN_COMPARISON),
          BLOCKARG_DATA_COMPARISON_OPERATOR + 1
        );

      // Add the value input for the match string, and move it
      const valueInput = this.appendValueInput(BLOCKARG_DATA_MATCH + 1);
      valueInput.setCheck(null);
      valueInput.connection.setShadowDom(null);
      this.moveInputBefore(BLOCKARG_DATA_MATCH + 1, "SUBSTACK");

      // Add another dummy input for attaching the minus icon,
      // and move it
      const dummyInput1 = this.appendDummyInput("DUMMY" + 1);
      this.moveInputBefore("DUMMY" + 1, "SUBSTACK");

      dummyInput1.appendField(
        new Blockly.FieldImage(
          REMOVE_ICON,
          ICON_SIZE,
          ICON_SIZE,
          "-",
          onMinusClicked
        ),
        "REMOVE"
      );

      // Get rid of the plus icon
      dummyInput0.removeField("ADD");

      // Add a shadow block in the match string input
      //
      // FIXME: A standalone shadow block seems to be created
      // in the workspace when dragging this block, which, if saved,
      // seems to cause issues while re-loading. The if statement
      // below is a work-around, but there might be a more sensible
      // solution to address this issue.
      if (!this.workspace.isDragging()) {
        const shadowBlock = this.workspace.newBlock("text");
        shadowBlock.setShadow(true);
        // https://groups.google.com/forum/#!topic/blockly/krWiGqYNf_s
        shadowBlock.initSvg();
        shadowBlock.render();
        shadowBlock.getField("TEXT").setValue("condition 2");
        valueInput.connection.connect(shadowBlock.outputConnection);
      }

      this.hasAdditionalCondition = true;

      // The new fields seem to be un-styled otherwise
      this.setStyle("data_blocks");
    },

    removeCondition: function () {
      // First, remove the minus icon, and its dummy input
      this.removeInput("DUMMY" + 1);

      // Remove the second match string value input
      // const matchInput1 = this.getInput(BLOCKARG_DATA_MATCH + 1);
      // if (matchInput1.connection.isConnected() === true) {
      //   matchInput1.connection.disconnect();
      // }
      this.removeInput(BLOCKARG_DATA_MATCH + 1);

      // Remove all the other added fields
      const dummyInput0 = this.getInput("DUMMY" + 0);
      dummyInput0.removeField(BLOCKARG_DATA_COMPARISON_OPERATOR + 1);
      dummyInput0.removeField(BLOCKARG_DATA_COLUMN + 1);
      dummyInput0.removeField(BLOCKARG_DATA_BOOLEAN + 0);

      // Add back the plus icon
      dummyInput0.appendField(
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
    const dummyInput0 = this.getInput("DUMMY" + 0);
    dummyInput0.appendField(
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
