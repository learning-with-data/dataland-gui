import { BLOCKARG_DEBUG_MESSAGE } from "../constants";

var blocks = {};

blocks["debug_log"] = {
  init: function () {
    this.jsonInit({
      message0: "log %1 to console",
      args0: [
        {
          type: "field_input",
          name: BLOCKARG_DEBUG_MESSAGE,
          text: "Hello DataLand!"
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
    });
  },
};

export default blocks;
