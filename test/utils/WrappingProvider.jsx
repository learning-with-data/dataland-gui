import React from "react";
import PropTypes from "prop-types";

import { Provider } from "react-redux";
import { RuntimeContext } from "../../src/components/connectToRuntime";


function WrappingProvider(props) {
  const { children, store, runtime } = props;
  return (
    <Provider store={store}>
      <RuntimeContext.Provider value={runtime}>
        {children}
      </RuntimeContext.Provider>
    </Provider>
  );
}

WrappingProvider.propTypes = {
  children: PropTypes.node,
  store: PropTypes.object,
  runtime: PropTypes.object,
};

export default WrappingProvider;