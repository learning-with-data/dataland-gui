import cloneDeep from "lodash/cloneDeep";

import {
  BLOCKARG_VISUALIZATION_COLOR,
  BLOCKARG_VISUALIZATION_COLUMN,
  BLOCKARG_VISUALIZATION_MARK,
  BLOCKARG_VISUALIZATION_TITLE,
} from "../blockly/constants";

import {
  VISUALIZATION_CLEAR_SPEC,
  VISUALIZATION_UPDATE_SPEC,
} from "../../redux/actionsTypes";

class VisualizationPrimTable {
  constructor(store) {
    this.store = store;
    this.mark = {
      type: "point",
      color: "#4682b4",
      tooltip: { content: "data" },
    };

    this.visualization_set_title = (b) => this.primVisualizationSetTitle(b);
    this.visualization_clear = () => this.primVisualizationClear();

    this.visualization_set_x = (b) => this.primVisualizationSetX(b);
    this.visualization_set_y = (b) => this.primVisualizationSetY(b);

    this.visualization_set_color_as_static = (b) =>
      (this.mark.color = b.thread.getBlockArg(b, BLOCKARG_VISUALIZATION_COLOR));
    this.visualization_set_color_as_var = (b) =>
      this.primVisualizationSetColor(b);

    this.visualization_set_mark = (b) =>
      (this.mark.type = b.thread.getBlockArg(b, BLOCKARG_VISUALIZATION_MARK));
  }

  primVisualizationSetTitle(block) {
    const title = block.thread.getBlockArg(block, BLOCKARG_VISUALIZATION_TITLE);

    const state = this.store.getState();
    const spec = state.visualizationState.visualizationSpec;

    const newSpec = { ...spec, title };

    this.store.dispatch({ type: VISUALIZATION_UPDATE_SPEC, payload: newSpec });
  }

  primVisualizationClear() {
    this.store.dispatch({ type: VISUALIZATION_CLEAR_SPEC });
  }

  primVisualizationSetX(block) {
    const column = block.thread.getBlockArg(
      block,
      BLOCKARG_VISUALIZATION_COLUMN
    );

    const state = this.store.getState();
    const data = state.projectDataState.data;
    const spec = state.visualizationState.visualizationSpec;

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.x !== undefined) {
      unitSpec = {
        data: { values: data },
        mark: this.mark,
        encoding: {},
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.x = {
      field: column,
      type: "quantitative",
      scale: { zero: false },
    };

    var newLayerSpec;
    if (newLayer) {
      newLayerSpec = spec.layer.concat(unitSpec);
    } else {
      newLayerSpec = spec.layer.map((unit) => {
        if (unit.name == unitSpec.name) return unitSpec;
        return unit;
      });
    }

    const newSpec = { ...spec, layer: newLayerSpec };

    this.store.dispatch({
      type: VISUALIZATION_UPDATE_SPEC,
      payload: newSpec,
    });
  }

  primVisualizationSetY(block) {
    const column = block.thread.getBlockArg(
      block,
      BLOCKARG_VISUALIZATION_COLUMN
    );

    const state = this.store.getState();
    const data = state.projectDataState.data;
    const spec = state.visualizationState.visualizationSpec;

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.y !== undefined) {
      unitSpec = {
        data: { values: data },
        mark: this.mark,
        encoding: {},
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.y = {
      field: column,
      type: "quantitative",
      scale: { zero: false },
    };

    var newLayerSpec;
    if (newLayer) {
      newLayerSpec = spec.layer.concat(unitSpec);
    } else {
      newLayerSpec = spec.layer.map((unit) => {
        if (unit.name == unitSpec.name) return unitSpec;
        return unit;
      });
    }

    const newSpec = { ...spec, layer: newLayerSpec };

    this.store.dispatch({
      type: VISUALIZATION_UPDATE_SPEC,
      payload: newSpec,
    });
  }

  primVisualizationSetColor(block) {
    const column = block.thread.getBlockArg(
      block,
      BLOCKARG_VISUALIZATION_COLUMN
    );

    const state = this.store.getState();
    const data = state.projectDataState.data;
    const spec = state.visualizationState.visualizationSpec;

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.color !== undefined) {
      unitSpec = {
        data: { values: data },
        mark: this.mark,
        encoding: {},
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.color = {
      field: column,
      type: "nominal", // ordinal?
    };

    var newLayerSpec;
    if (newLayer) {
      newLayerSpec = spec.layer.concat(unitSpec);
    } else {
      newLayerSpec = spec.layer.map((unit) => {
        if (unit.name == unitSpec.name) return unitSpec;
        return unit;
      });
    }

    const newSpec = { ...spec, layer: newLayerSpec };

    this.store.dispatch({
      type: VISUALIZATION_UPDATE_SPEC,
      payload: newSpec,
    });
  }
}

export default VisualizationPrimTable;
