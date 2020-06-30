import { PROJECT_CODE_IMPORTED, PROJECT_CODE_UPDATED } from "../actionsTypes";

const initialState = {
  code: "",
  codeImportTimestamp: 0,
  codeUpdateTimestamp: 0,
};

function projectCodeReducer(state = initialState, action) {
  switch (action.type) {
    case PROJECT_CODE_IMPORTED:
      return {
        ...state,
        code: action.payload,
        codeUpdateTimestamp: Date.now(),
        codeImportTimestamp: Date.now(),
      };
    case PROJECT_CODE_UPDATED:
      return {
        ...state,
        code: action.payload,
        codeUpdateTimestamp: Date.now(),
      };
    default:
      return state;
  }
}

export default projectCodeReducer;
