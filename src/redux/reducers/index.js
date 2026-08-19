import {
  GUI_ERROR_CLEARED,
  GUI_ERROR_OCCURRED,
  GUI_INTERPRETER_STARTED,
  GUI_INTERPRETER_STOPPED,
  GUI_PROJECT_MODIFIED,
  GUI_PROJECT_SAVED,
  AI_CHAT_MESSAGE_ADDED,
  AI_CHAT_SET_TYPING,
  AI_CHAT_HISTORY_CLEARED,
} from "../actionsTypes";

const initialState = {
  errors: [],
  interpreterStatus: "STOPPED",
  projectModifiedTimeStamp: null,
  projectSavedTimeStamp: null,
  aiChat: {
    history: [],
    isTyping: false,
  },
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case GUI_PROJECT_MODIFIED:
      return { ...state, projectModifiedTimeStamp: Date.now() };
    case GUI_PROJECT_SAVED:
      return { ...state, projectSavedTimeStamp: Date.now() };
    case GUI_ERROR_CLEARED:
      var error_id = action.payload;
      return {
        ...state,
        errors: state.errors.filter((err) => err.id !== error_id),
      };
    case GUI_ERROR_OCCURRED:
      var errorObj = {
        id: Math.random().toString(36).slice(2),
        error: action.payload.error,
        message: action.payload.message,
        created: Date.now(),
      };
      return { ...state, errors: state.errors.concat(errorObj) };
    case GUI_INTERPRETER_STARTED:
      return { ...state, interpreterStatus: "RUNNING" };
    case GUI_INTERPRETER_STOPPED:
      return { ...state, interpreterStatus: "STOPPED" };
    case AI_CHAT_MESSAGE_ADDED:
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          history: [...state.aiChat.history, action.payload],
        },
      };
    case AI_CHAT_SET_TYPING:
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          isTyping: action.payload,
        },
      };
    case AI_CHAT_HISTORY_CLEARED:
      return {
        ...state,
        aiChat: {
          history: [],
          isTyping: false,
        },
      };
    default:
      return state;
  }
}

export default reducer;
