import {
  BLOCKARG_OPERATOR_A,
  BLOCKARG_OPERATOR_B,
  BLOCKARG_OPERATOR_OP,
  BLOCKDROPDOWN_ARITHMETIC_OP,
  BLOCKDROPDOWN_BOOLEAN,
  BLOCKDROPDOWN_COMPARISON,
} from "../constants";

var blocks = {};

blocks["operator_arithmetic"] = {
  init: function () {
    this.jsonInit({
      type: "operator_arithmetic",
      message0: "%1 %2 %3",
      args0: [
        {
          type: "input_value",
          name: BLOCKARG_OPERATOR_A,
          check: "Number",
        },
        {
          type: "field_dropdown",
          name: BLOCKARG_OPERATOR_OP,
          options: BLOCKDROPDOWN_ARITHMETIC_OP,
        },
        {
          type: "input_value",
          name: BLOCKARG_OPERATOR_B,
          check: "Number",
        },
      ],
      inputsInline: true,
      output: null,
      style: "operator_blocks",
    });
  },
};

blocks["operator_random"] = {
  init: function () {
    this.jsonInit({
      type: "operator_random",
      message0: "pick random between %1 and %2",
      args0: [
        {
          type: "input_value",
          name: BLOCKARG_OPERATOR_A,
          check: "Number",
        },
        {
          type: "input_value",
          name: BLOCKARG_OPERATOR_B,
          check: "Number",
        },
      ],
      inputsInline: true,
      output: null,
      style: "operator_blocks",
    });
  },
};

blocks["operator_compare"] = {
  init: function () {
    this.jsonInit({
      type: "operator_arithmetic",
      message0: "%1 %2 %3",
      args0: [
        {
          type: "input_value",
          name: BLOCKARG_OPERATOR_A,
          check: "Number",
        },
        {
          type: "field_dropdown",
          name: BLOCKARG_OPERATOR_OP,
          options: BLOCKDROPDOWN_COMPARISON,
        },
        {
          type: "input_value",
          name: BLOCKARG_OPERATOR_B,
          check: "Number",
        },
      ],
      inputsInline: true,
      output: "Boolean",
      style: "operator_blocks",
    });
  },
};

blocks["operator_boolean"] = {
  init: function () {
    this.jsonInit({
      type: "operator_boolean",
      message0: "%1 %2 %3",
      args0: [
        {
          type: "input_value",
          name: BLOCKARG_OPERATOR_A,
          check: "Boolean",
        },
        {
          type: "field_dropdown",
          name: BLOCKARG_OPERATOR_OP,
          options: BLOCKDROPDOWN_BOOLEAN,
        },
        {
          type: "input_value",
          name: BLOCKARG_OPERATOR_B,
          check: "Boolean",
        },
      ],
      inputsInline: true,
      output: "Boolean",
      style: "operator_blocks",
    });
  },
};

export default blocks;
