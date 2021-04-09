import ControlToolbox from "./control";
import DataToolbox from "./data";
import MapsToolbox from "./maps";
import OperatorsToolbox from "./operator";
import VisualizationToolbox from "./visualization";

/// #if DEBUG
import DebugToolbox from "./debug";
/// #endif

function getBlocklyToolbox(microworld) {
  return (
    "" +
    // eslint-disable-next-line quotes
    '<xml id="toolbox" style="display: none">' +
    ControlToolbox +
    OperatorsToolbox +
    DataToolbox +
    (microworld === "maps" ? MapsToolbox : VisualizationToolbox) +
    // eslint-disable-next-line quotes
    '<category name="⊡ Variables" categorystyle="variable_category" custom="VARIABLE"></category>' +
    /// #if DEBUG
    DebugToolbox +
    /// #endif
    "</xml>"
  );
}

export default getBlocklyToolbox;
