import * as Blockly from "blockly/core";
import { registerFieldColour } from "@blockly/field-colour";

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
    // Call super so the div gets its id and the
    // blocklyToolboxCategoryContainer class that Blockly's focus manager
    // and click handler depend on.
    const container = /** @type {!HTMLDivElement} */ (
      super.createContainer_()
    );

    if (this.toolboxItemDef_["tooltip"] !== undefined) {
      container.setAttribute("data-bs-toggle", "tooltip");
      container.setAttribute("data-bs-placement", "auto");
      container.setAttribute("title", this.toolboxItemDef_["tooltip"]);

      this.tooltip = new Tooltip(container);

      container.addEventListener("click", () => {
        this.tooltip?.hide();
      });
    }

    return container;
  }

}

function getBlocklyToolbox(microworld) {
  Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    CategoryWithTooltips,
    true
  );
  registerFieldColour();

  return (
    "" +
    // eslint-disable-next-line quotes
    '<xml id="' +
    uniqueId("toolbox-") +
    "\" style=\"display: none\">" +
    ControlToolbox +
    OperatorsToolbox +
    DataToolbox +
    (microworld === "maps" ? MapsToolbox : VisualizationToolbox) +
    // eslint-disable-next-line quotes
    '<category name="⊡ Variables" toolboxitemid="variable_category" categorystyle="variable_category" custom="VARIABLE"></category>' +
    /// #if DEBUG
    DebugToolbox +
    /// #endif
    "</xml>"
  );
}

export default getBlocklyToolbox;
