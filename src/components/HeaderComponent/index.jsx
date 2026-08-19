import React from "react";

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import PropTypes from "prop-types";

import SaveStatusComponent from "../SaveStatusComponent";

import { AI_ENABLED } from "../../config";

import "./style.css";

const HeaderComponent = React.memo((props) => {
  return (
    <header className="gui-header d-flex justify-content-between align-items-center">
      <div className="d-flex justify-content-between align-items-center">
        {AI_ENABLED && (
          <Button
            variant="outline-primary"
            className="ai-helper-button mr-2"
            onClick={props.onToggleAiHelper}
          >
            AI Helper
          </Button>
        )}
        <div className="title ml-2 d-flex justify-content-between align-items-center">
          <Form.Control
            defaultValue={props.initialProjectTitle}
            className="mr-2 project-title-input"
            onBlur={(e) => props.onProjectTitleChange(e.target.value)}
          />{" "}
          <SaveStatusComponent />
        </div>
      </div>
      {props.children}
    </header>
  );
});

HeaderComponent.propTypes = {
  onProjectTitleChange: PropTypes.func,
  onToggleAiHelper: PropTypes.func,
  children: PropTypes.element,
  initialProjectTitle: PropTypes.string.isRequired,
};

HeaderComponent.displayName = "HeaderComponent";

export default HeaderComponent;
