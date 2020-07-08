import React from "react";
import PropTypes from "prop-types";

import Button from "react-bootstrap/Button";

function FullScreenButtonComponent(props) {
  return (
    <Button
      size="sm"
      variant="outline-dark"
      disabled={props.disabled}
      onClick={props.fullScreenButtonClickHandler}
    >
      {props.isCurrentlyFullScreen && (
        <svg
          title="Fullscreen icon"
          width="1em"
          height="1em"
          viewBox="0 0 16 16"
          className="bi bi-fullscreen-exit"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"
          />
        </svg>
      )}
      {!props.isCurrentlyFullScreen && (
        <svg
          title="Exit fullscreen icon"
          width="1em"
          height="1em"
          viewBox="0 0 16 16"
          className="bi bi-fullscreen"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"
          />
        </svg>
      )}
    </Button>
  );
}

FullScreenButtonComponent.propTypes = {
  disabled: PropTypes.bool,
  fullScreenButtonClickHandler: PropTypes.func,
  isCurrentlyFullScreen: PropTypes.bool,
};

export default FullScreenButtonComponent;
