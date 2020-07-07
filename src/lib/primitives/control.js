import { BLOCKARG_CONTROL_WAIT_DURATION } from "../blockly/constants";

class ControlPrimTable {
  constructor() {
    this.event_onprojectstart = (b) => this.primEventOnProjectStart(b);
    this.control_wait = (b) => this.primControlWait(b);
  }

  primEventOnProjectStart() {
    return "project-started";
  }

  primControlWait(block) {
    var waitTime = block.thread.getBlockArg(
      block,
      BLOCKARG_CONTROL_WAIT_DURATION
    );
    block.thread.setStateWaiting();
    setTimeout(() => {
      block.thread.setStateReady();
    }, waitTime * 1000);
  }
}

export default ControlPrimTable;
