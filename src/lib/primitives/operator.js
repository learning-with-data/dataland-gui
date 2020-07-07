import {
  BLOCKARG_OPERATOR_A,
  BLOCKARG_OPERATOR_B,
  BLOCKARG_OPERATOR_OP,
} from "../blockly/constants";

class OperatorPrimTable {
  constructor() {
    this.operator_arithmetic = (b) => this.primOperatorArithmetic(b);
    this.operator_random = (b) => this.primOperatorRandom(b);

    this.operator_compare = (b) => this.primOperatorCompare(b);
    this.operator_boolean = (b) => this.primOperatorBoolean(b);
  }

  primOperatorArithmetic(block) {
    // TODO: This will return a NaN if one of the arguments is a number
    // (e.g., if someone puts in a reporter with a string output in one
    // of the slots). Figure out the best way to deal with such a situation
    const a = Number(block.thread.getBlockArg(block, BLOCKARG_OPERATOR_A));
    const op = block.thread.getBlockArg(block, BLOCKARG_OPERATOR_OP);
    const b = Number(block.thread.getBlockArg(block, BLOCKARG_OPERATOR_B));

    switch (op) {
      case "add":
        return a + b;
      case "subtract":
        return a - b;
      case "multiply":
        return a * b;
      case "divide":
        return a / b;
      default:
        console.warn("Got unknown arithmetic op:", op);
        return 0;
    }
  }

  primOperatorRandom(block) {
    var min = Math.ceil(block.thread.getBlockArg(block, BLOCKARG_OPERATOR_A));
    var max = Math.floor(block.thread.getBlockArg(block, BLOCKARG_OPERATOR_B));
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  primOperatorCompare(block) {
    const a = block.thread.getBlockArg(block, BLOCKARG_OPERATOR_A);
    const op = block.thread.getBlockArg(block, BLOCKARG_OPERATOR_OP);
    const b = block.thread.getBlockArg(block, BLOCKARG_OPERATOR_B);

    switch (op) {
      case "eq":
        return a == b;
      case "neq":
        return a !== b;
      case "gt":
        return a > b;
      case "lt":
        return a < b;
      case "gte":
        return a >= b;
      case "lte":
        return a <= b;
      default:
        console.warn("Got unknown comparison op:", op);
        return false;
    }
  }

  primOperatorBoolean(block) {
    const a = block.thread.getBlockArg(block, BLOCKARG_OPERATOR_A);
    const op = block.thread.getBlockArg(block, BLOCKARG_OPERATOR_OP);
    const b = block.thread.getBlockArg(block, BLOCKARG_OPERATOR_B);

    switch (op) {
      case "and":
        return a && b;
      case "or":
        return a || b;
      default:
        console.warn("Got unknown boolean op:", op);
        return false;
    }
  }

}

export default OperatorPrimTable;
