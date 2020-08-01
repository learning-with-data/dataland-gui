import {
  BLOCKARG_VISUALIZATION_COLOR,
  BLOCKARG_VISUALIZATION_COLUMN,
  BLOCKARG_VISUALIZATION_MARK,
  BLOCKARG_VISUALIZATION_TITLE,
  BLOCKDROPDOWN_MARK,
} from "../constants";

function VisualizationBlocks(generate_data_columns) {
  var blocks = {};

  blocks["visualization_set_title"] = {
    init: function () {
      this.jsonInit({
        message0: "set visualization title to %1",
        args0: [
          {
            type: "input_value",
            name: BLOCKARG_VISUALIZATION_TITLE,
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
    init: function () {
      this.jsonInit({
        message0: "set ‘x’ of plot to %1",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_VISUALIZATION_COLUMN,
            options: generate_data_columns,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_set_y"] = {
    init: function () {
      this.jsonInit({
        message0: "set ‘y’ of plot to %1",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_VISUALIZATION_COLUMN,
            options: generate_data_columns,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_set_color_as_static"] = {
    init: function () {
      this.jsonInit({
        message0: "set plotting color to %1",
        args0: [
          {
            type: "input_value",
            name: BLOCKARG_VISUALIZATION_COLOR,
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
            type: "field_dropdown",
            name: BLOCKARG_VISUALIZATION_COLUMN,
            options: generate_data_columns,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_set_mark"] = {
    init: function () {
      this.jsonInit({
        message0: "set plotting mark to %1",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_VISUALIZATION_MARK,
            options: BLOCKDROPDOWN_MARK,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "visualization_blocks",
      });
    },
  };

  blocks["visualization_set_size"] = {
    init: function () {
      this.jsonInit({
        message0: "set plotting mark size to %1",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_VISUALIZATION_COLUMN,
            options: generate_data_columns,
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
