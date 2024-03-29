import {
  BLOCKARG_VARIABLE_NAME,
  BLOCKARG_VARIABLE_VALUE,
} from "../blockly/constants";

class VariablesPrimTable {
  constructor(runtime) {
    this.runtime = runtime;

    this.variables_set = (b) => this.primVariableSet(b);
    this.variables_get = (b) => this.primVariableGet(b);
  }

  primVariableSet(block) {
    const variableName = block.thread.getBlockArg(block, BLOCKARG_VARIABLE_NAME);
    var variableValue = block.thread.getBlockArg(block, BLOCKARG_VARIABLE_VALUE);

    this.runtime.setVariable(variableName, variableValue);
  }

  primVariableGet(block) {
    const variableName = block.thread.getBlockArg(block, BLOCKARG_VARIABLE_NAME);
    return this.runtime.getVariable(variableName);
  }
}

export default VariablesPrimTable;
