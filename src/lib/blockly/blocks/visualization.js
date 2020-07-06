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

  blocks["visualization_set_x"] = {
    init: function() {
      this.jsonInit({
        message0: "set ‘x’ of plot to %1",
        args0: [
          {
            type: "input_value",
            name: "COLUMN"
          }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    }
  };

  blocks["visualization_set_y"] = {
    init: function() {
      this.jsonInit({
        message0: "set ‘y’ of plot to %1",
        args0: [
          {
            type: "input_value",
            name: "COLUMN"
          }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    }
  };

  blocks["visualization_set_color_as_static"] = {
    init: function () {
      this.jsonInit({
        message0: "set plotting color to %1",
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


  blocks["visualization_set_color_as_var"] = {
    init: function () {
      this.jsonInit({
        message0: "set plotting color to %1",
        args0: [
          {
            type: "input_value",
            name: "COLUMN",
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  return blocks;
}

export default VisualizationBlocks;
