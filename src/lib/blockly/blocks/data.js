import {
  BLOCKARG_DATA_COLUMN,
  BLOCKARG_DATA_COMPARISON_OPERATOR,
  BLOCKARG_DATA_MATCH,
} from "../constants";

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
            name: BLOCKARG_DATA_COLUMN,
            options: generate_columns,
          },
          {
            type: "field_dropdown",
            name: BLOCKARG_DATA_COMPARISON_OPERATOR,
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
            name: BLOCKARG_DATA_MATCH,
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
        style: "data_blocks",
      });
    },
  };

  return blocks;
}

export default DataBlocks;
