/* eslint-disable quotes */
import * as Blockly from "blockly/core";

import { Tooltip } from "bootstrap";

import ControlToolbox from "./control";
import DataToolbox from "./data";
import MapsToolbox from "./maps";
import OperatorsToolbox from "./operator";
import VisualizationToolbox from "./visualization";

import uniqueId from "lodash/uniqueId";

/// #if DEBUG
import DebugToolbox from "./debug";
/// #endif

class CategoryWithTooltips extends Blockly.ToolboxCategory {
  // TODO: Pull this out into a plugin

  /**
   * Constructor for a custom category.
   * @override
   */
  constructor(categoryDef, toolbox, opt_parent) {
    super(categoryDef, toolbox, opt_parent);
  }

  /** @override */
  createContainer_() {
    const container = /** @type {!HTMLDivElement} */ (
      document.createElement("div")
    );
    container.classList.add(this.cssConfig_["container"]);

    if (this.toolboxItemDef_["tooltip"] !== undefined) {
      container.setAttribute("data-bs-toggle", "tooltip");
      container.setAttribute("data-bs-placement", "auto");
      container.setAttribute("title", this.toolboxItemDef_["tooltip"]);

      this.tooltip = new Tooltip(container);
    }

    return container;
  }

  onClick(){
    this.tooltip?.hide();
  }

}

function getBlocklyToolbox(microworld) {
  Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    CategoryWithTooltips,
    true
  );

  return (
    "" +
    // eslint-disable-next-line quotes
    '<xml id="' +
    uniqueId("toolbox-") +
    '" style="display: none">' +
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
