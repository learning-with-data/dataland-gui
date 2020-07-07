import { BLOCKARG_DEBUG_MESSAGE } from "../blockly/constants";

class DebugPrimTable {
  constructor() {
    this.debug_log = (b) =>
      console.log(b.thread.getBlockArg(b, BLOCKARG_DEBUG_MESSAGE));
  }
}

export default DebugPrimTable;
