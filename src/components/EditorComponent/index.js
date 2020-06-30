import React, { Component } from "react";

import { connect, ReactReduxContext } from "react-redux";
import PropTypes from "prop-types";

import { PROJECT_CODE_UPDATED } from "../../redux/actionsTypes";
import getCustomBlockly from "../../lib/blocks";
import Toolbox from "../../lib/toolbox";

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
      scrollbars: false,
      toolbox: Toolbox,
      toolboxPosition: "start",
      horizontalLayout: false,
      trashcan: false,
      sounds: false,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 4,
        minScale: 0.25,
        scaleSpeed: 1.1,
      },
      colours: {
        workspace: "#758B91",
        flyout: "#4B4F51",
        scrollbar: "#DCDCDC",
        scrollbarHover: "#F7F8F9",
        insertionMarker: "#FFFFFF",
        insertionMarkerOpacity: 0.3,
        fieldShadow: "rgba(255, 255, 255, 0.3)",
        dragShadowOpacity: 0.6,
        data: { primary: "#4b4a60", secondary: "#454458", tertiary: "#353444" },
      },
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
