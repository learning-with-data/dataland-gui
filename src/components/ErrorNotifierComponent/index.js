import React from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import Toast from "react-bootstrap/Toast";

import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";

import { GUI_ERROR_CLEARED } from "../../redux/actionsTypes";

function ErrorNotifierComponent(props) {
  dayjs.extend(RelativeTime);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="d-flex justify-content-center align-items-center"
      style={{ maxHeight: "0px", position: "relative", zIndex: 9999 }}
    >
      <div style={{ position: "absolute", top: "1em" }}>
        {props.errors.map((error) => {
          return (
            <Toast
              className="error-notification"
              key={error.id}
              style={{ minWidth: "40ch" }}
              onClose={() => props.error_cleared(error.id)}
            >
              <Toast.Header>
                <svg
                  width="1.2em"
                  height="1.2em"
                  viewBox="0 0 16 16"
                  className="bi bi-exclamation-triangle-fill mr-2"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 5zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                  />
                </svg>
                <strong className="mr-auto">Whoops!</strong>
                <small>{dayjs(error.created).fromNow()}</small>
              </Toast.Header>
              <Toast.Body>
                Something went wrong.
                <br />
                {error.message}
              </Toast.Body>
            </Toast>
          );
        })}
      </div>
    </div>
  );
}

ErrorNotifierComponent.propTypes = {
  errors: PropTypes.array,
  error_cleared: PropTypes.func,
};

const mapStateToProps = function (store) {
  return {
    errors: store.guiState.errors,
  };
};

const error_cleared = (error_id) => ({
  type: GUI_ERROR_CLEARED,
  payload: error_id,
});

export default connect(mapStateToProps, { error_cleared })(
  ErrorNotifierComponent
);
