import { combineReducers } from "redux";

// Reducers
import gioReducer from "./gui-reducer";
import projectDataReducer from "./project-data-reducer";
import visualizationReducer from "./visualization-reducters";

// Combine Reducers
var reducers = combineReducers({
  guiState: gioReducer,
  projectDataState: projectDataReducer,
  visualizationState: visualizationReducer,
});

export default reducers;
