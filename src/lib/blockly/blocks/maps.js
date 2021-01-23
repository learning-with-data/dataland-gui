import {
  BLOCKARG_MAPS_COLOR,
  BLOCKARG_MAPS_COLUMN,
} from "../constants";

function MapsBlocks(generate_data_columns) {
  var blocks = {};

  blocks["maps_clear"] = {
    init: function () {
      this.jsonInit({
        message0: "clear map",
        previousStatement: null,
        nextStatement: null,
        style: "maps_blocks",
      });
    },
  };

  blocks["maps_set_latitude"] = {
    init: function () {
      this.jsonInit({
        message0: "set ‘latitude’ of map plot to %1",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_MAPS_COLUMN,
            options: generate_data_columns,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "maps_blocks",
      });
    },
  };

  blocks["maps_set_longitude"] = {
    init: function () {
      this.jsonInit({
        message0: "set ‘longitude’ of map plot to %1",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_MAPS_COLUMN,
            options: generate_data_columns,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "maps_blocks",
      });
    },
  };

  blocks["maps_set_size"] = {
    init: function () {
      this.jsonInit({
        message0: "set size of map plot mark to %1",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_MAPS_COLUMN,
            options: generate_data_columns,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "maps_blocks",
      });
    },
  };

  blocks["maps_set_color"] = {
    init: function () {
      this.jsonInit({
        message0: "set color of map plot mark to %1",
        args0: [
          {
            type: "field_dropdown",
            name: BLOCKARG_MAPS_COLUMN,
            options: generate_data_columns,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "maps_blocks",
      });
    },
  };

  blocks["maps_set_color_as_static"] = {
    init: function () {
      this.jsonInit({
        message0: "set map plotting color to %1",
        args0: [
          {
            type: "input_value",
            name: BLOCKARG_MAPS_COLOR,
          },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: "maps_blocks",
      });
    },
  };


  return blocks;
}

export default MapsBlocks;
