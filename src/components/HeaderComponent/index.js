import React from "react";

import Form from "react-bootstrap/Form";

import PropTypes from "prop-types";

import SaveStatusComponent from "../SaveStatusComponent";

import "./style.css";

function HeaderComponent(props) {
  return (
    <header className="gui-header d-flex justify-content-between align-items-center">
      <div className="title ml-2 d-flex justify-content-between align-items-center">
        <Form.Control
          defaultValue={props.projectTitle}
          className="mr-2"
          onBlur={(e) =>
            props.backend
              ? props.backendMetaDataSaveHandler({ title: e.target.value })
              : {}
          }
        />{" "}
        {props.backend && (
          <SaveStatusComponent
            lastSaveTimestamp={props.lastSaveTimestamp}
            lastSaveRequestTimeStamp={props.lastSaveRequestTimeStamp}
          />
        )}
      </div>
      {props.children}
    </header>
  );
}

HeaderComponent.propTypes = {
  backend: PropTypes.bool.isRequired,
  backendMetaDataSaveHandler: PropTypes.func,
  children: PropTypes.element,
  projectTitle: PropTypes.string.isRequired,
  lastSaveTimestamp: PropTypes.number,
  lastSaveRequestTimeStamp: PropTypes.number,
};

export default HeaderComponent;
