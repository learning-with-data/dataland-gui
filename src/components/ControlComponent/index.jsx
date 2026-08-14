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
          style={{ minWidth: "10em" }}
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
          {!props.isInterpreterRunning && (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                title="Start icon"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-play-fill"
                viewBox="0 0 16 16"
              >
                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
              </svg>
              {" Start"}
            </>
          )}
        </Button>{" "}
        <Button
          className="stop-button"
          variant="danger"
          name="button"
          style={{ minWidth: "10em" }}
          onClick={props.handleStopPress}
          disabled={!props.isInterpreterRunning}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            title="Stop icon"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-stop-fill"
            viewBox="0 0 16 16"
          >
            <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z" />
          </svg>
          Stop
        </Button>
      </div>
      <div className="d-flex">
        <Button
          size="sm"
          variant="outline-dark"
          className="mr-2"
          active={props.isEditorExpanded}
          onClick={props.handleExpandContractPress}
        >
          {!props.isEditorExpanded && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              title="Expand icon"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-arrows-angle-expand"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"
              />
            </svg>
          )}
          {props.isEditorExpanded && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              title="Contract Icon"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-arrows-angle-contract"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M.172 15.828a.5.5 0 0 0 .707 0l4.096-4.096V14.5a.5.5 0 1 0 1 0v-3.975a.5.5 0 0 0-.5-.5H1.5a.5.5 0 0 0 0 1h2.768L.172 15.121a.5.5 0 0 0 0 .707zM15.828.172a.5.5 0 0 0-.707 0l-4.096 4.096V1.5a.5.5 0 1 0-1 0v3.975a.5.5 0 0 0 .5.5H14.5a.5.5 0 0 0 0-1h-2.768L15.828.879a.5.5 0 0 0 0-.707z"
              />
            </svg>
          )}
        </Button>
        {}
        <DropdownButton
          align="end"
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
  handleExpandContractPress: PropTypes.func,

  isInterpreterRunning: PropTypes.bool,
  isEditorExpanded: PropTypes.bool,
};

const mapStateToProps = function (store) {
  return {
    isInterpreterRunning: store.interpreterStatus === "RUNNING",
  };
};

export default connect(mapStateToProps)(ControlComponent);
