import React from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import uniqueId from "lodash/uniqueId";

import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Spinner from "react-bootstrap/Spinner";

function ControlComponent(props) {
  const loadLinkId = uniqueId("load-link-");

  return (
    <>
      <div>
        <Button
          className="start-button"
          variant="success"
          style={{minWidth: "10em"}}
          onClick={props.handleStartPress}
          disabled={props.isInterpreterRunning}
        >
          {props.isInterpreterRunning && (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              className="mr-2"
              role="status"
              aria-hidden="true"
            />
          )}
          {props.isInterpreterRunning && "Running"}
          {!props.isInterpreterRunning && "⯈ Start"}
        </Button>{" "}
        <Button
          className="stop-button"
          variant="danger"
          name="button"
          style={{minWidth: "10em"}}
          onClick={props.handleStopPress}
          disabled={!props.isInterpreterRunning}
        >
          ⯀ Stop
        </Button>
      </div>
      <div className="d-flex">
        <DropdownButton
          alignRight
          variant="outline-secondary"
          className="mr-2 file-dropdown"
          title="File"
        >
          <Dropdown.Item
            onClick={props.handleProjectSavePress}
            className="download-menuitem"
          >
            <svg
              title="download icon"
              width="1em"
              height="1em"
              viewBox="0 0 16 16"
              className="bi bi-file-arrow-down"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4 1h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H4z"
              />
              <path
                fillRule="evenodd"
                d="M4.646 8.146a.5.5 0 0 1 .708 0L8 10.793l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"
              />
              <path
                fillRule="evenodd"
                d="M8 4a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6A.5.5 0 0 1 8 4z"
              />
            </svg>{" "}
            Save project to your computer
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => document.getElementById(loadLinkId).click()}
            className="upload-menuitem"
          >
            <svg
              title="upload icon"
              width="1em"
              height="1em"
              viewBox="0 0 16 16"
              className="bi bi-file-arrow-up"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4 1h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H4z"
              />
              <path
                fillRule="evenodd"
                d="M4.646 7.854a.5.5 0 0 0 .708 0L8 5.207l2.646 2.647a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 0 0 0 .708z"
              />
              <path
                fillRule="evenodd"
                d="M8 12a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 0 .5.5z"
              />
            </svg>{" "}
            Load project from your computer
          </Dropdown.Item>
        </DropdownButton>
        <input
          type="file"
          id={loadLinkId}
          className="upload-link"
          style={{ display: "none" }}
          accept=".dbp"
          onChange={props.handleProjectLoadPress}
        />
      </div>
    </>
  );
}

ControlComponent.propTypes = {
  handleProjectSavePress: PropTypes.func,
  handleProjectLoadPress: PropTypes.func,
  handleStartPress: PropTypes.func,
  handleStopPress: PropTypes.func,

  isInterpreterRunning: PropTypes.bool,
};

const mapStateToProps = function (store) {
  return {
    isInterpreterRunning: store.interpreterStatus === "RUNNING",
  };
};

export default connect(mapStateToProps)(ControlComponent);
