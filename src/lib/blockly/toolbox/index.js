import ControlToolbox from "./control";
import OperatorsToolbox from "./operator";
import DataToolbox from "./data";
import VisualizationToolbox from "./visualization";

import DebugToolbox from "./debug";

const BlocklyToolbox = "" + 
    "<xml id=\"toolbox\" style=\"display: none\">" +
    ControlToolbox +
    OperatorsToolbox +
    DataToolbox +
    VisualizationToolbox +
    "<category name=\"⊡ Variables\" categorystyle=\"variable_category\" custom=\"VARIABLE\"></category>" +
    DebugToolbox +
    "</xml>";

export default BlocklyToolbox;