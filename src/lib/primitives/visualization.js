import cloneDeep from "lodash/cloneDeep";

import {
  VISUALIZATION_CLEAR_SPEC,
  VISUALIZATION_UPDATE_SPEC,
} from "../../redux/actionsTypes";

class VisualizationPrimTable {
  constructor(store) {
    this.store = store;
    this.color = "#4682b4";
    this.legend_title = "";

    this.visualization_set_title = (b) => this.primVisualizationSetTitle(b);
    this.visualization_set_legend_title = (b) =>
      (this.legend_title = b.thread.getBlockArg(b, 0));

    this.visualization_set_color = (b) =>
      (this.color = b.thread.getBlockArg(b, 0));
    this.visualization_create_legend = (b) =>
      this.primVisualizationCreateLegend(b);

    this.visualization_scatterplot = (b) =>
      this.primVisualizationScatterPlot(b);

    this.visualization_clear = () => this.primVisualizationClear();
  }

  primVisualizationSetTitle(block) {
    const title = block.thread.getBlockArg(block, 0);

    const state = this.store.getState();
    const spec = state.visualizationState.visualizationSpec;

    const newSpec = { ...spec, title };

    this.store.dispatch({ type: VISUALIZATION_UPDATE_SPEC, payload: newSpec });
  }

  primVisualizationCreateLegend(block) {
    // This is a bit ugly - perhaps a sign to move to targetting vega
    // H/t to https://stackoverflow.com/a/61180176

    const label = block.thread.getBlockArg(block, 0);

    const state = this.store.getState();
    const spec = state.visualizationState.visualizationSpec;

    var legendSpec = cloneDeep(spec.layer.find((unit) => unit.name === "legend"));

    if (legendSpec.encoding.color.legend === null) {
      // legend was turned off, turn it back on
      legendSpec.encoding.color.legend = { title: this.legend_title };
    }

    legendSpec.encoding.color.scale.domain.push(label);
    legendSpec.encoding.color.scale.range.push(this.color);

    const newLayerSpec = spec.layer.map((unit) => {
      if (unit.name === "legend") return legendSpec;
      return unit;
    });

    const newSpec = { ...spec, layer: newLayerSpec };

    this.store.dispatch({
      type: VISUALIZATION_UPDATE_SPEC,
      payload: newSpec,
    });
  }

  primVisualizationScatterPlot(block) {
    const xcol = block.thread.getBlockArg(block, 0);
    const ycol = block.thread.getBlockArg(block, 1);

    const state = this.store.getState();
    const data = state.projectDataState.data;
    const spec = state.visualizationState.visualizationSpec;

    const generatedSpec = {
      data: { values: data },
      mark: {
        type: "point",
        color: this.color,
        tooltip: { content: "data" },
      },
      encoding: {
        x: {
          field: xcol,
          type: "quantitative",
          scale: { zero: false },
        },
        y: {
          field: ycol,
          type: "quantitative",
          scale: { zero: false },
        },
      },
    };

    const newSpec = { ...spec, layer: spec.layer.concat(generatedSpec) };

    this.store.dispatch({
      type: VISUALIZATION_UPDATE_SPEC,
      payload: newSpec,
    });
  }

  primVisualizationClear() {
    this.store.dispatch({ type: VISUALIZATION_CLEAR_SPEC });
  }
}

export default VisualizationPrimTable;
