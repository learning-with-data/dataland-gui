class DebugPrimTable {
  constructor() {
    this.debug_log = (b) => console.log(b.thread.getBlockArg(b, 0));
  }
}

export default DebugPrimTable;
