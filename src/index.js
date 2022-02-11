import React, { Component } from "react";

import { createStore } from "redux";
import { Provider } from "react-redux";
import PropTypes from "prop-types";

import _Gui from "./Gui";
import initBlockly from "./lib/blockly/blocks";

import Runtime from "./lib/Runtime";
import { RuntimeContext } from "./components/connectToRuntime";

import reducers from "./redux/reducers";

// See https://gist.github.com/gaearon/eeee2f619620ab7b55673a4ee2bf8400
// and https://redux.js.org/recipes/isolating-redux-sub-apps
class Gui extends Component {
  constructor(props) {
    super(props);

    this.store = createStore(
      reducers,
      // https://stackoverflow.com/a/55881955 to make this work with Cypress
      window.__REDUX_DEVTOOLS_EXTENSION__
        ? window.__REDUX_DEVTOOLS_EXTENSION__()
        : (f) => f
    );

    this.runtime = new Runtime();
  }

  render() {
    return (
      <Provider store={this.store}>
        <RuntimeContext.Provider
          microworld={this.props.microworld}
          value={this.runtime}
        >
          <_Gui {...this.props} />
        </RuntimeContext.Provider>
      </Provider>
    );
  }
}

Gui.propTypes = {
  microworld: PropTypes.string.isRequired,
};

export { Gui, initBlockly };
