import Blockly from "scratch-blocks";

import ControlBlocks from "./control";
import OperatorBlocks from "./operator";
import DataBlocks from "./data";
import VisualizationBlocks from "./visualization";

import DebugBlocks from "./debug";

function getCustomBlockly(store) {
  Object.assign(
    Blockly.Blocks,
    ControlBlocks,
    OperatorBlocks,
    DataBlocks(store),
    VisualizationBlocks(store),
    DebugBlocks
  );
  return Blockly;
}

export default getCustomBlockly;
