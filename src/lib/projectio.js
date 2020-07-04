import pako from "pako";
import isEmpty from "lodash/isEmpty";

import {
  PROJECT_CODE_IMPORTED,
  PROJECT_DATA_IMPORTED,
} from "../redux/actionsTypes";

function createProjectBlob(store) {
  const state = store.getState();

  const code = state.projectCodeState.code;
  const codets = state.projectCodeState.codeUpdateTimestamp;
  const data = state.projectDataState.originalData;
  const datats = state.projectDataState.originalDataTimestamp;

  return pako.deflate(
    JSON.stringify({
      code: code,
      data: data,
      blob_generated_timestamp: Date.now(),
      code_updated_timestamp: codets,
      data_imported_timestamp: datats,
    })
  );
}

function loadProjectBlob(store, blob) {
  var inflated, parsed;
  try {
    inflated = pako.inflate(blob, { to: "string" });
  } catch (err) {
    console.log("Failed to decompress project. Giving up.");
    console.log(err);
    return;
  }

  try {
    parsed = JSON.parse(inflated);
  } catch (err) {
    console.log("Failed to parse decompressed project. Giving up.");
    console.log(err);
    return;
  }

  // TODO use import { batch } from 'react-redux' ?

  // The data needs to be loaded first, otherwise the
  // dynamic menus for the column selectors get reset
  if (!isEmpty(parsed.data)) {
    store.dispatch({
      type: PROJECT_DATA_IMPORTED,
      payload: parsed.data,
    });
  }
  
  store.dispatch({
    type: PROJECT_CODE_IMPORTED,
    payload: parsed.code,
  });
}

export { createProjectBlob, loadProjectBlob };
