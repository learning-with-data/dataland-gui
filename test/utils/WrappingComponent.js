import React from "react";

import { Provider } from "react-redux";
import PropTypes from "prop-types";


function WrappingComponent(props) {
  const { children, store } = props;
  console.dir(store);
  return <Provider store={store}>{children}</Provider>;
}

WrappingComponent.propTypes = {
  children: PropTypes.node,
  store: PropTypes.shape({}),
};

WrappingComponent.defaultProps = {
  children: null,
  store: null,
};

export default WrappingComponent;
