class VariablesPrimTable {
  constructor() {
    this.varTable = {};

    this.variables_set = (b) => this.primVariableSet(b);
    this.variables_get = (b) => this.primVariableGet(b);
  }

  primVariableSet(block) {
    const variableName = block.thread.getBlockArg(block, 0);
    var variableValue = block.thread.getBlockArg(block, 1);

    if (!Number.isNaN(variableValue)) variableValue = Number(variableValue);

    this.varTable[variableName] = variableValue;
  }

  primVariableGet(block) {
    const variableName = block.thread.getBlockArg(block, 0);
    return this.varTable[variableName];
  }
}

export default VariablesPrimTable;
