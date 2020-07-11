import React, { Component } from "react";

import { connect, ReactReduxContext } from "react-redux";
import PropTypes from "prop-types";

import DataLandTheme from "../../lib/blockly/theme";
import { GUI_ERROR_OCCURRED } from "../../redux/actionsTypes";
import getCustomBlockly from "../../lib/blockly/blocks";
import Toolbox from "../../lib/blockly/toolbox";

import "./style.css";

const blocklyOptions = {
  comments: true,
  disable: false,
  collapse: false,
  media: "/blocks-media/",
  readOnly: false,
  rtl: false,
  scrollbars: true,
  toolbox: Toolbox,
  toolboxPosition: "start",
  horizontalLayout: false,
  trashcan: true,
  sounds: false,
  zoom: {
    controls: true,
    wheel: true,
    startScale: 0.85,
    maxScale: 4,
    minScale: 0.25,
    scaleSpeed: 1.1,
  },
  theme: DataLandTheme,
  renderer: "zelos",
};

class EditorComponent extends Component {
  static contextType = ReactReduxContext;

  constructor(props, context) {
    super(props, context);
    this.Blockly = getCustomBlockly(this.context.store);
  }

  componentDidMount() {
    this.workspace = this.Blockly.inject("editorContainer", blocklyOptions);
    if (this.props.initialCode) {
      try {
        this.Blockly.Xml.clearWorkspaceAndLoadFromXml(
          this.Blockly.Xml.textToDom(this.props.initialCode),
          this.workspace
        );
      } catch (err) {
        this.props.error_occurred(
          err,
          "Failed to load project into the editor."
        );
      }
    }

    this.workspace.addChangeListener(() => {
      var xmlCode = this.Blockly.Xml.domToText(
        this.Blockly.Xml.workspaceToDom(this.workspace)
      );
      this.props.onCodeUpdated(xmlCode);
    });
  }

  render() {
    return (
      <div id="editorContainer" style={{ width: "100%", height: "100%" }}></div>
    );
  }
}

EditorComponent.propTypes = {
  initialCode: PropTypes.string,
  onCodeUpdated: PropTypes.func,

  error_occurred: PropTypes.func,
};

const error_occurred = (error, message) => ({
  type: GUI_ERROR_OCCURRED,
  payload: { error, message },
});

export default connect(null, { error_occurred }, null, {
  forwardRef: true,
})(EditorComponent);
