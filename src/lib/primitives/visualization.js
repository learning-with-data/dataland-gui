import {
  VISUALIZATION_CLEAR,
  VISUALIZATION_DRAW_SCATTERPLOT,
  VISUALIZATION_SET_TITLE,
} from "../../redux/actionsTypes";


class VisualizationPrimTable {
  constructor(store) {
    this.store = store;
    this.color = "#4682b4";

    this.visualization_set_color = (b) =>
      (this.color = b.thread.getBlockArg(b, 0));

    this.visualization_set_title = (b) => this.primVisualizationSetTitle(b);

    this.visualization_scatterplot = (b) =>
      this.primVisualizationScatterPlot(b);

    this.visualization_clear = () => this.primVisualizationClear();
  }

  primVisualizationSetTitle(block) {
    const title = block.thread.getBlockArg(block, 0);

    const state = this.store.getState();
    const spec = state.visualizationState.visualizationSpec;

    const newSpec = { ...spec, title };

    this.store.dispatch({ type: VISUALIZATION_SET_TITLE, payload: newSpec });
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

    this.store.dispatch({ type: VISUALIZATION_DRAW_SCATTERPLOT, payload: newSpec });
  }

  primVisualizationClear() {
    const state = this.store.getState();
    const spec = state.visualizationState.visualizationSpec;

    const newSpec = { ...spec, layer: [] };

    this.store.dispatch({ type: VISUALIZATION_CLEAR, payload: newSpec });
  }

}

export default VisualizationPrimTable;
