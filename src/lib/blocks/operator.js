import Blockly from "scratch-blocks";

var blocks = {};

blocks["operator_add"] = {
  /**
   * Block for adding two numbers.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 + %2",
      args0: [
        {
          type: "input_value",
          name: "NUM1",
        },
        {
          type: "input_value",
          name: "NUM2",
        },
      ],
      inputsInline: true,
      output: "Number",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_subtract"] = {
  /**
   * Block for subtracting two numbers.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 - %2",
      args0: [
        {
          type: "input_value",
          name: "NUM1",
        },
        {
          type: "input_value",
          name: "NUM2",
        },
      ],
      inputsInline: true,
      output: "Number",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_multiply"] = {
  /**
   * Block for multiplying two numbers.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 * %2",
      args0: [
        {
          type: "input_value",
          name: "NUM1",
        },
        {
          type: "input_value",
          name: "NUM2",
        },
      ],
      inputsInline: true,
      output: "Number",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_divide"] = {
  /**
   * Block for dividing two numbers.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 / %2",
      args0: [
        {
          type: "input_value",
          name: "NUM1",
        },
        {
          type: "input_value",
          name: "NUM2",
        },
      ],
      inputsInline: true,
      output: "Number",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_random"] = {
  /**
   * Block for picking a random number.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "pick random %1 to %2",
      args0: [
        {
          type: "input_value",
          name: "FROM",
        },
        {
          type: "input_value",
          name: "TO",
        },
      ],
      inputsInline: true,
      output: "Number",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_lt"] = {
  /**
   * Block for less than comparator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 < %2",
      args0: [
        {
          type: "input_value",
          name: "OPERAND1",
        },
        {
          type: "input_value",
          name: "OPERAND2",
        },
      ],
      inputsInline: true,
      output: "Boolean",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_HEXAGONAL,
    });
  },
};

blocks["operator_equals"] = {
  /**
   * Block for equals comparator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 = %2",
      args0: [
        {
          type: "input_value",
          name: "OPERAND1",
        },
        {
          type: "input_value",
          name: "OPERAND2",
        },
      ],
      inputsInline: true,
      output: "Boolean",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_HEXAGONAL,
    });
  },
};

blocks["operator_gt"] = {
  /**
   * Block for greater than comparator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 > %2",
      args0: [
        {
          type: "input_value",
          name: "OPERAND1",
        },
        {
          type: "input_value",
          name: "OPERAND2",
        },
      ],
      inputsInline: true,
      output: "Boolean",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_HEXAGONAL,
    });
  },
};

blocks["operator_and"] = {
  /**
   * Block for "and" boolean comparator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 and %2",
      args0: [
        {
          type: "input_value",
          name: "OPERAND1",
          check: "Boolean",
        },
        {
          type: "input_value",
          name: "OPERAND2",
          check: "Boolean",
        },
      ],
      inputsInline: true,
      output: "Boolean",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_HEXAGONAL,
    });
  },
};

blocks["operator_or"] = {
  /**
   * Block for "or" boolean comparator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 or %2",
      args0: [
        {
          type: "input_value",
          name: "OPERAND1",
          check: "Boolean",
        },
        {
          type: "input_value",
          name: "OPERAND2",
          check: "Boolean",
        },
      ],
      inputsInline: true,
      output: "Boolean",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_HEXAGONAL,
    });
  },
};

blocks["operator_not"] = {
  /**
   * Block for "not" unary boolean operator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "not %1",
      args0: [
        {
          type: "input_value",
          name: "OPERAND",
          check: "Boolean",
        },
      ],
      inputsInline: true,
      output: "Boolean",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_HEXAGONAL,
    });
  },
};

blocks["operator_join"] = {
  /**
   * Block for string join operator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "join %1 %2",
      args0: [
        {
          type: "input_value",
          name: "STRING1",
        },
        {
          type: "input_value",
          name: "STRING2",
        },
      ],
      inputsInline: true,
      output: "String",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_letter_of"] = {
  /**
   * Block for "letter _ of _" operator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "letter %1 of %2",
      args0: [
        {
          type: "input_value",
          name: "LETTER",
        },
        {
          type: "input_value",
          name: "STRING",
        },
      ],
      inputsInline: true,
      output: "String",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_length"] = {
  /**
   * Block for string length operator.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "length of %1",
      args0: [
        {
          type: "input_value",
          name: "STRING",
        },
      ],
      inputsInline: true,
      output: "Number",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_mod"] = {
  /**
   * Block for mod two numbers.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 mod %2",
      args0: [
        {
          type: "input_value",
          name: "NUM1",
        },
        {
          type: "input_value",
          name: "NUM2",
        },
      ],
      inputsInline: true,
      output: "Number",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_mathop_menu"] = {
  /**
   * Math ops drop-down menu.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1",
      args0: [
        {
          type: "field_dropdown",
          name: "OPERATOR",
          options: [
            ["round", "round"],
            ["abs", "abs"],
            ["floor", "floor"],
            ["ceiling", "ceiling"],
            ["sqrt", "sqrt"],
            ["sin", "sin"],
            ["cos", "cos"],
            ["tan", "tan"],
            ["asin", "asin"],
            ["acos", "acos"],
            ["atan", "atan"],
            ["ln", "ln"],
            ["log", "log"],
            ["e ^", "e ^"],
            ["10 ^", "10 ^"],
          ],
        },
      ],
      inputsInline: true,
      output: "String",
      colour: Blockly.Colours.operators.secondary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

blocks["operator_mathop"] = {
  /**
   * Block for "advanced" math ops on a number.
   * @this Blockly.Block
   */
  init: function () {
    this.jsonInit({
      message0: "%1 of %2",
      args0: [
        {
          type: "input_value",
          name: "OPERATOR",
        },
        {
          type: "input_value",
          name: "NUM",
        },
      ],
      inputsInline: true,
      output: "Number",
      category: Blockly.Categories.operators,
      colour: Blockly.Colours.operators.primary,
      colourSecondary: Blockly.Colours.operators.secondary,
      colourTertiary: Blockly.Colours.operators.tertiary,
      outputShape: Blockly.OUTPUT_SHAPE_ROUND,
    });
  },
};

export default blocks;