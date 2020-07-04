import {
  VISUALIZATION_DRAW_SCATTERPLOT,
  VISUALIZATION_SET_TITLE,
  VISUALIZATION_CLEAR,
} from "../actionsTypes";

const initialState = {
  visualizationSpec: {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    width: "container",
    height: "container",
    layer: [],
  },
};

function visualizationReducer(state = initialState, action) {
  switch (action.type) {
    case VISUALIZATION_CLEAR:
      return { ...state, visualizationSpec: action.payload };
    case VISUALIZATION_DRAW_SCATTERPLOT:
    case VISUALIZATION_SET_TITLE:
      return { ...state, visualizationSpec: action.payload };
    default:
      return state;
  }
}

export default visualizationReducer;
