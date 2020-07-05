function VisualizationBlocks(store) {
  var blocks = {};

  function generate_columns() {
    const state = store.getState();
    if (state.projectDataState.columns.length === 0) {
      return [["Row #", "Row #"]];
    } else {
      return state.projectDataState.columns.map((x) => [x.text, x.text]);
    }
  }

  blocks["visualization_get_menu"] = {
    init: function () {
      this.jsonInit({
        message0: "%1",
        args0: [
          {
            type: "field_dropdown",
            name: "COLUMN",
            options: generate_columns,
          },
        ],
        inputsInline: true,
        output: "String",
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_set_title"] = {
    init: function () {
      this.jsonInit({
        message0: "set visualization title to %1",
        args0: [
          {
            type: "input_value",
            name: "STRING",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_set_legend_title"] = {
    init: function () {
      this.jsonInit({
        message0: "set legend title to %1",
        args0: [
          {
            type: "input_value",
            name: "STRING",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_set_color"] = {
    init: function () {
      this.jsonInit({
        message0: "set drawing color to %1",
        args0: [
          {
            type: "input_value",
            name: "COLOR",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_create_legend"] = {
    init: function () {
      this.jsonInit({
        message0: "create legend with label %1",
        args0: [
          {
            type: "input_value",
            name: "STRING",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_scatterplot"] = {
    init: function () {
      this.jsonInit({
        message0: "draw scatter-plot of %1 and %2",
        args0: [
          {
            type: "input_value",
            name: "COLUMN1",
          },
          {
            type: "input_value",
            name: "COLUMN2",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_clear"] = {
    init: function () {
      this.jsonInit({
        message0: "clear visualization",
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  return blocks;
}

export default VisualizationBlocks;
