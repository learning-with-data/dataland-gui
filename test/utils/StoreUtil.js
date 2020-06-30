import { createStore } from "redux";

import reducers from "../../src/redux/reducers";

const createUsualStore = (initialState) => {
  return createStore(reducers, initialState);
};

export default createUsualStore;
