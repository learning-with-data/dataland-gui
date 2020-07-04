import ControlToolbox from "./control";
import OperatorsToolbox from "./operator";
import DataToolbox from "./data";
import VisualizationToolbox from "./visualization";

import DebugToolbox from "./debug";

/*eslint quotes: [2, "double", "avoid-escape"]*/
const BlocklyToolbox = "" + 
    '<xml id="toolbox" style="display: none">' +
    ControlToolbox +
    OperatorsToolbox +
    DataToolbox +
    VisualizationToolbox +
    DebugToolbox +
    "</xml>";

export default BlocklyToolbox;