var blocks = {};

const color = "#aeaca9";
const colorSecondary = "#737270";

blocks["debug_log"] = {
  /**
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "log %1 to console",
      args0: [
        {
          type: "input_value",
          name: "STRING",
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: color,
      colourSecondary: colorSecondary,
      colourTertiary: colorSecondary,
    });
  },
};

export default blocks;