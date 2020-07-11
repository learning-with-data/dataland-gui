import {
  GUI_ERROR_CLEARED,
  GUI_ERROR_OCCURRED,
  GUI_PROJECT_MODIFIED,
  GUI_PROJECT_SAVED,
} from "../actionsTypes";

const initialState = {
  errors: [],
  projectModifiedTimeStamp: null,
  projectSavedTimeStamp: null,
};

function guiReducer(state = initialState, action) {
  switch (action.type) {
    case GUI_PROJECT_MODIFIED:
      return { ...state, projectModifiedTimeStamp: Date.now() };
    case GUI_PROJECT_SAVED:
      return { ...state, projectSavedTimeStamp: Date.now() };
    case GUI_ERROR_CLEARED:
      var error_id = action.payload.id;
      return {
        ...state,
        errors: state.errors.filter((err) => err.id != error_id),
      };
    case GUI_ERROR_OCCURRED:
      var errorObj = {
        id: Math.random().toString(36).slice(2),
        error: action.payload.error,
        message: action.payload.message,
      };
      return { ...state, errors: state.errors.concat(errorObj) };
    default:
      return state;
  }
}

export default guiReducer;
