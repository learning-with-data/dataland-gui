import {
  VISUALIZATION_CLEAR,
  VISUALIZATION_DRAW_SCATTERPLOT,
  VISUALIZATION_SET_TITLE,
} from "../actionsTypes";

function drawScatterplot(plotInfo) {
  return (dispatch, getState) => {
    const state = getState();
    const data = state.projectDataState.data;
    const spec = state.visualizationState.visualizationSpec;

    const generatedSpec = {
      data: { values: data },
      mark: {
        type: "point",
        color: plotInfo.color ? plotInfo.color : "#4682b4",
        tooltip: { content: "data" },
      },
      encoding: {
        x: {
          field: plotInfo.xcol,
          type: "quantitative",
          scale: { zero: false },
        },
        y: {
          field: plotInfo.ycol,
          type: "quantitative",
          scale: { zero: false },
        },
      },
    };

    const newSpec = { ...spec, layer: spec.layer.concat(generatedSpec) };

    return dispatch({ type: VISUALIZATION_DRAW_SCATTERPLOT, payload: newSpec });
  };
}

function setPlotTitle(title) {
  return (dispatch, getState) => {
    const state = getState();
    const spec = state.visualizationState.visualizationSpec;

    const newSpec = { ...spec, title };

    return dispatch({ type: VISUALIZATION_SET_TITLE, payload: newSpec });
  };
}

function clearPlot() {
  return (dispatch, getState) => {
    const state = getState();
    const spec = state.visualizationState.visualizationSpec;

    const newSpec = { ...spec, layer: [] };

    return dispatch({ type: VISUALIZATION_CLEAR, payload: newSpec });
  };
}

export { clearPlot, drawScatterplot, setPlotTitle };
