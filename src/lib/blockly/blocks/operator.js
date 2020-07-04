var blocks = {};

// blocks["operator_arithmetic"] = {
//   init: function () {
//     this.jsonInit();
//   },
// };
blocks["operator_arithmeticops_menu"] = {
  init: function () {
    this.jsonInit({
      message0: "%1",
      args0: [
        {
          type: "field_dropdown",
          name: "COLUMN",
          options: [
            ["+", "add"],
            ["-", "subtract"],
            ["*", "multiply"],
            ["÷", "divide"],
          ],
        },
      ],
      inputsInline: true,
      output: "String",
      style: "operator_blocks",
    });
  },
};

blocks["operator_compare_menu"] = {
  init: function () {
    this.jsonInit({
      message0: "%1",
      args0: [
        {
          type: "field_dropdown",
          name: "COLUMN",
          options: [
            ["=", "eq"],
            ["≠", "neq"],
            [">", "gt"],
            ["<", "lt"],
            ["≥", "gte"],
            ["≤", "lte"],
          ],
        },
      ],
      inputsInline: true,
      output: "String",
      style: "operator_blocks",
    });
  },
};

blocks["operator_boolean_menu"] = {
  init: function () {
    this.jsonInit({
      message0: "%1",
      args0: [
        {
          type: "field_dropdown",
          name: "COLUMN",
          options: [
            ["and", "and"],
            ["or", "or"]
          ],
        },
      ],
      inputsInline: true,
      output: "String",
      style: "operator_blocks",
    });
  },
};

blocks["operator_arithmetic"] = {
  init: function () {
    this.jsonInit({
      type: "operator_arithmetic",
      message0: "%1 %2 %3",
      args0: [
        {
          type: "input_value",
          name: "A",
          check: "Number",
        },
        {
          type: "input_value",
          name: "OP",
        },
        {
          type: "input_value",
          name: "B",
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
          name: "A",
          check: "Number",
        },
        {
          type: "input_value",
          name: "B",
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
          name: "A",
          check: "Number",
        },
        {
          type: "input_value",
          name: "OP",
        },
        {
          type: "input_value",
          name: "B",
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
          name: "A",
          check: "Boolean",
        },
        {
          type: "input_value",
          name: "OP",
        },
        {
          type: "input_value",
          name: "B",
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
