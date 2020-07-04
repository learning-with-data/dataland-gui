import { combineReducers } from "redux";

// Reducers
import projectCodeReducer from "./project-code-reducer";
import projectDataReducer from "./project-data-reducer";
import visualizationReducer from "./visualization-reducters";

// Combine Reducers
var reducers = combineReducers({
  projectCodeState: projectCodeReducer,
  projectDataState: projectDataReducer,
  visualizationState: visualizationReducer,
});

export default reducers;
