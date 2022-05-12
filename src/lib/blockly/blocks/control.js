import {
  BLOCKARG_CONTROL_IF_CONDITION,
  BLOCKARG_CONTROL_REPEAT_TIMES,
  BLOCKARG_CONTROL_WAIT_DURATION,
} from "../constants";

var blocks = {};

blocks["event_onprojectstart"] = {
  init: function () {
    this.jsonInit({
      message0: "⯈ on project start",
      inputsInline: true,
      nextStatement: null,
      style: "control_blocks",
      tooltip:
        "This block should be placed on top of any block stacks that you would like to run",
    });
  },
};

blocks["control_repeat"] = {
  init: function () {
    this.jsonInit({
      id: "control_repeat",
      message0: "repeat %1",
      message1: "%1",
      lastDummyAlign2: "RIGHT",
      args0: [
        {
          type: "input_value",
          name: BLOCKARG_CONTROL_REPEAT_TIMES,
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
      style: "control_blocks",
    });
  },
};

blocks["control_if"] = {
  init: function () {
    this.jsonInit({
      type: "control_if",
      message0: "if %1 then",
      message1: "%1",
      args0: [
        {
          type: "input_value",
          name: BLOCKARG_CONTROL_IF_CONDITION,
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
      style: "control_blocks",
    });
  },
};

blocks["control_if_else"] = {
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
          name: BLOCKARG_CONTROL_IF_CONDITION,
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
      style: "control_blocks",
      tooltip:
        "This block will execute its 'if' section if the given condition is met; if the condition is not met, the 'else' section will be executed",
    });
  },
};

blocks["control_wait"] = {
  init: function () {
    this.jsonInit({
      id: "control_wait",
      message0: "wait %1 secs",
      args0: [
        {
          type: "input_value",
          name: BLOCKARG_CONTROL_WAIT_DURATION,
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: "control_blocks",
    });
  },
};

export default blocks;
