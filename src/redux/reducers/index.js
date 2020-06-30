import { combineReducers } from "redux";

// Reducers
import projectCodeReducer from "./project-code-reducer";
import projectDataReducer from "./project-data-reducer";

// Combine Reducers
var reducers = combineReducers({
  projectCodeState: projectCodeReducer,
  projectDataState: projectDataReducer,
});

export default reducers;
