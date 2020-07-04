import {clearPlot, drawScatterplot, setPlotTitle} from "../../redux/thunks/visualization-thunks";

class VisualizationPrimTable {
  constructor(store) {
    this.store = store;
    this.color = "#4682b4";

    this.visualization_set_color = (b) =>
      (this.color = b.thread.getBlockArg(b, 0));

    this.visualization_set_title = (b) =>
      this.store.dispatch(setPlotTitle(b.thread.getBlockArg(b, 0)));

    this.visualization_scatterplot = (b) =>
      this.primVisualizationScatterPlot(b);

    this.visualization_clear = () => this.store.dispatch(clearPlot());
  }

  primVisualizationScatterPlot(block) {
    const xcol = block.thread.getBlockArg(block, 0);
    const ycol = block.thread.getBlockArg(block, 1);

    this.store.dispatch(drawScatterplot({ xcol, ycol, color: this.color }));
  }
}

export default VisualizationPrimTable;
