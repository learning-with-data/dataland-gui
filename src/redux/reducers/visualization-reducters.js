import {
  VISUALIZATION_CLEAR_SPEC,
  VISUALIZATION_UPDATE_SPEC
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
    case VISUALIZATION_CLEAR_SPEC:
      return initialState;
    case VISUALIZATION_UPDATE_SPEC:
      return { ...state, visualizationSpec: action.payload };
    default:
      return state;
  }
}

export default visualizationReducer;
