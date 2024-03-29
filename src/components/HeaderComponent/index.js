import React from "react";

import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";

import SaveStatusComponent from "../SaveStatusComponent";

import "./style.css";

const HeaderComponent = React.memo((props) => {
  return (
    <header className="gui-header d-flex justify-content-between align-items-center">
      <div className="title ml-2 d-flex justify-content-between align-items-center">
        <Form.Control
          defaultValue={props.initialProjectTitle}
          className="mr-2 project-title-input"
          onBlur={(e) => props.onProjectTitleChange(e.target.value)}
        />{" "}
        <SaveStatusComponent />
      </div>
      {props.children}
    </header>
  );
});

HeaderComponent.propTypes = {
  onProjectTitleChange: PropTypes.func,
  children: PropTypes.element,
  initialProjectTitle: PropTypes.string.isRequired,
};

HeaderComponent.displayName = "HeaderComponent";

export default HeaderComponent;
