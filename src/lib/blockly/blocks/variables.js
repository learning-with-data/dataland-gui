import { BLOCKARG_VARIABLE_NAME, BLOCKARG_VARIABLE_VALUE } from "../constants";

var blocks = {};

blocks["variables_get"] = {
  init: function () {
    this.jsonInit({
      type: "variables_get",
      message0: "%1",
      args0: [
        {
          type: "field_variable",
          name: BLOCKARG_VARIABLE_NAME,
          variable: "%{BKY_VARIABLES_DEFAULT_NAME}",
        },
      ],
      output: null,
      style: "variable_blocks",
      tooltip:
        "This block is a variable that stores a value. You can view the current value of the variable in the 'Variable' panel on the right.",
    });
  },
};

blocks["variables_set"] = {
  init: function () {
    this.jsonInit({
      type: "variables_set",
      message0: "%{BKY_VARIABLES_SET}",
      args0: [
        {
          type: "field_variable",
          name: BLOCKARG_VARIABLE_NAME,
          variable: "%{BKY_VARIABLES_DEFAULT_NAME}",
        },
        {
          type: "input_value",
          name: BLOCKARG_VARIABLE_VALUE,
          check: ["Number", "String"],
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: "variable_blocks",
      tooltip:
        "This block will assign a value to a variable. The value can be a number or text.",
    });
  },
};

export default blocks;
