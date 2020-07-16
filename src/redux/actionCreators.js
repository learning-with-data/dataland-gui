import * as actionsTypes from "./actionsTypes";

export const error_occurred = (error, message) => ({
  type: actionsTypes.GUI_ERROR_OCCURRED,
  payload: { error, message },
});

export const error_cleared = (error_id) => ({
  type: actionsTypes.GUI_ERROR_CLEARED,
  payload: error_id,
});

export const interpreter_started = () => ({
  type: actionsTypes.GUI_INTERPRETER_STARTED,
});

export const interpreter_stopped = () => ({
  type: actionsTypes.GUI_INTERPRETER_STOPPED,
});

export const project_modified = () => ({
  type: actionsTypes.GUI_PROJECT_MODIFIED,
});

export const project_saved = () => ({
  type: actionsTypes.GUI_PROJECT_SAVED,
});
