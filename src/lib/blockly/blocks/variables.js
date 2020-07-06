var blocks = {};

blocks["variables_get"] = {
  init: function () {
    this.jsonInit({
      type: "variables_get",
      message0: "%1",
      args0: [
        {
          type: "field_variable",
          name: "VAR",
          variable: "%{BKY_VARIABLES_DEFAULT_NAME}",
        },
      ],
      output: null,
      style: "variable_blocks",
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
          name: "VAR",
          variable: "%{BKY_VARIABLES_DEFAULT_NAME}",
        },
        {
          type: "input_value",
          name: "VALUE",
          check: ["Number", "String"],
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: "variable_blocks",
    });
  },
};

export default blocks;
