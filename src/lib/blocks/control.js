import Blockly from "scratch-blocks";

var blocks = {};

blocks["event_onprojectstart"] = {
  /**
   * Block for when this sprite clicked.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "⯈ on project start",
      inputsInline: true,
      nextStatement: null,
      category: Blockly.Categories.control,
      colour: Blockly.Colours.control.primary,
      colourSecondary: Blockly.Colours.control.secondary,
      colourTertiary: Blockly.Colours.control.tertiary,
    });
  },
};

blocks["control_repeat"] = {
  /**
   * Block for repeat n times (external number).
   * https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#so57n9
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      id: "control_repeat",
      message0: "repeat %1",
      message1: "%1", // Statement
      message2: "%1", // Icon
      lastDummyAlign2: "RIGHT",
      args0: [
        {
          type: "input_value",
          name: "TIMES",
        },
      ],
      args1: [
        {
          type: "input_statement",
          name: "SUBSTACK",
        },
      ],
      args2: [
        {
          type: "field_image",
          src: Blockly.mainWorkspace.options.pathToMedia + "/c_arrow.svg",
          width: 16,
          height: 16,
          alt: "*",
          flip_rtl: true,
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      category: Blockly.Categories.control,
      colour: Blockly.Colours.control.primary,
      colourSecondary: Blockly.Colours.control.secondary,
      colourTertiary: Blockly.Colours.control.tertiary,
    });
  },
};

blocks["control_if"] = {
  /**
   * Block for if-then.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      type: "control_if",
      message0: "if %1 then",
      message1: "%1", // Statement
      args0: [
        {
          type: "input_value",
          name: "CONDITION",
          check: "Boolean",
        },
      ],
      args1: [
        {
          type: "input_statement",
          name: "SUBSTACK",
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      category: Blockly.Categories.control,
      colour: Blockly.Colours.control.primary,
      colourSecondary: Blockly.Colours.control.secondary,
      colourTertiary: Blockly.Colours.control.tertiary,
    });
  },
};

blocks["control_if_else"] = {
  /**
   * Block for if-else.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      type: "control_if_else",
      message0: "if %1 then",
      message1: "%1",
      message2: "else",
      message3: "%1",
      args0: [
        {
          type: "input_value",
          name: "CONDITION",
          check: "Boolean",
        },
      ],
      args1: [
        {
          type: "input_statement",
          name: "SUBSTACK",
        },
      ],
      args3: [
        {
          type: "input_statement",
          name: "SUBSTACK2",
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      category: Blockly.Categories.control,
      colour: Blockly.Colours.control.primary,
      colourSecondary: Blockly.Colours.control.secondary,
      colourTertiary: Blockly.Colours.control.tertiary,
    });
  },
};

blocks["control_wait"] = {
  /**
   * Block to wait (pause) stack.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      id: "control_wait",
      message0: "wait %1 secs",
      args0: [
        {
          type: "input_value",
          name: "DURATION",
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      category: Blockly.Categories.control,
      colour: Blockly.Colours.control.primary,
      colourSecondary: Blockly.Colours.control.secondary,
      colourTertiary: Blockly.Colours.control.tertiary,
    });
  },
};

export default blocks;