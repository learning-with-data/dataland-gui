import React, { Component } from "react";

import { connect, ReactReduxContext } from "react-redux";
import PropTypes from "prop-types";

import DataLandTheme from "../../lib/blockly/theme";
import { PROJECT_CODE_UPDATED } from "../../redux/actionsTypes";
import getCustomBlockly from "../../lib/blockly/blocks";
import Toolbox from "../../lib/blockly/toolbox";

import "./style.css";

class EditorComponent extends Component {
  static contextType = ReactReduxContext;

  constructor(props, context) {
    super(props, context);

    this._editorDiv = (
      <div id="editorContainer" style={{ width: "100%", height: "100%" }}></div>
    );

    this.Blockly = getCustomBlockly(this.context.store);
  }

  componentDidMount() {
    this.workspace = this.Blockly.inject("editorContainer", {
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
    });

    if (this.props.initialCode) {
      try {
        this.Blockly.Xml.clearWorkspaceAndLoadFromXml(
          this.Blockly.Xml.textToDom(this.props.initialCode),
          this.workspace
        );
      } catch (err) {
        console.log(err);
      }
    }

    this.workspace.addChangeListener(() => {
      var xmlCode = this.Blockly.Xml.domToText(
        this.Blockly.Xml.workspaceToDom(this.workspace)
      );
      this.props.project_code_updated(xmlCode);
    });
  }

  render() {
    return this._editorDiv;
  }

  shouldComponentUpdate() {
    // See discussion in https://stackoverflow.com/a/49803151
    return false;
  }
}

EditorComponent.propTypes = {
  initialCode: PropTypes.string,
  project_code_updated: PropTypes.func,
};

const mapStateToProps = function (store) {
  return {
    initialCode: store.projectCodeState.code,
  };
};

const project_code_updated = (payload) => ({
  type: PROJECT_CODE_UPDATED,
  payload: payload,
});

export default connect(mapStateToProps, { project_code_updated })(
  EditorComponent
);
