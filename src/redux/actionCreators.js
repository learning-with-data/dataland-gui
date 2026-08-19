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

export const ai_chat_message_added = (message) => ({
  type: actionsTypes.AI_CHAT_MESSAGE_ADDED,
  payload: message,
});

export const ai_chat_set_typing = (isTyping) => ({
  type: actionsTypes.AI_CHAT_SET_TYPING,
  payload: isTyping,
});

export const ai_chat_history_cleared = () => ({
  type: actionsTypes.AI_CHAT_HISTORY_CLEARED,
});
