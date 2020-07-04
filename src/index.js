import React, { Component } from "react";

import { applyMiddleware, compose, createStore } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";

import _Gui from "./Gui";
import reducers from "./redux/reducers";

// See https://gist.github.com/gaearon/eeee2f619620ab7b55673a4ee2bf8400
// and https://redux.js.org/recipes/isolating-redux-sub-apps
class Gui extends Component {
  constructor(props) {
    super(props);

    this.store = createStore(
      reducers,
      compose(
        applyMiddleware(thunk),
        // https://stackoverflow.com/a/55881955 to make this work with Cypress
        window.__REDUX_DEVTOOLS_EXTENSION__
          ? window.__REDUX_DEVTOOLS_EXTENSION__()
          : (f) => f
      )
    );
  }

  render() {
    return (
      <Provider store={this.store}>
        <_Gui {...this.props} />
      </Provider>
    );
  }
}

export default Gui;
