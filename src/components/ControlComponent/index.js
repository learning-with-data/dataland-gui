import React from "react";

import PropTypes from "prop-types";

import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

function ControlComponent(props) {
  return (
    <>
      <div>
        <Button
          variant="success"
          id="btn-start"
          onClick={props.handleStartPress}
        >
          ⯈ Start
        </Button>{" "}
        <Button
          variant="danger"
          name="button"
          id="btn-stop"
          onClick={props.handleStopPress}
        >
          ⯀ Stop
        </Button>
      </div>
      <div className="d-flex">
        <DropdownButton
          alignRight
          variant="outline-secondary"
          id="file-dropdown"
          className="mr-2"
          title="File"
        >
          <Dropdown.Item
            onClick={props.handleProjectSavePress}
            id="download-menuitem"
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
            onClick={() => document.getElementById("loadLink").click()}
            id="upload-menuitem"
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
          id="loadLink"
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
};

export default ControlComponent;
