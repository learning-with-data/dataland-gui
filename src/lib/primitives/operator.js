class OperatorPrimTable {
  constructor() {
    this.operator_add = (b) => b.thread.getBlockArg(b, 0) + b.thread.getBlockArg(b, 1);
    
    this.operator_subtract = function (b) {
      return b.thread.getBlockArg(b, 0) - b.thread.getBlockArg(b, 1);
    };
    this.operator_multiply = function (b) {
      return b.thread.getBlockArg(b, 0) * b.thread.getBlockArg(b, 1);
    };
    this.operator_divide = function (b) {
      return b.thread.getBlockArg(b, 0) / b.thread.getBlockArg(b, 1);
    };
    this.operator_random = (b) => this.primOperatorRandom(b);

    this.operator_lt = (b) =>
      b.thread.getBlockArg(b, 0) < b.thread.getBlockArg(b, 1);
    this.operator_equals = (b) =>
      b.thread.getBlockArg(b, 0) === b.thread.getBlockArg(b, 1);
    this.operator_gt = (b) =>
      b.thread.getBlockArg(b, 0) > b.thread.getBlockArg(b, 1);

    this.operator_join = function (b) {
      return b.thread.getBlockArg(b, 0) + b.thread.getBlockArg(b, 1);
    };
    this.operator_letter_of = (b) => this.primOperatorLetterOf(b);
    this.operator_length = function (b) {
      return b.thread.getBlockArg(b, 0).length;
    };
    // this.operator_mod = (b) => this.primOperatorMod(b);
    // this.operator_mathop = (b) => this.primOperatorMathOp(b);
  }

  primOperatorRandom(block) {
    var min = Math.ceil(block.thread.getBlockArg(block, 0));
    var max = Math.floor(block.thread.getBlockArg(block, 1));
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export default OperatorPrimTable;
