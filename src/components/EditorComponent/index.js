import React, { Component } from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import DataLandTheme from "../../lib/blockly/theme";
import getCustomBlockly from "../../lib/blockly/blocks";
import getBlocklyToolbox from "../../lib/blockly/toolbox";

import { connectToRuntime } from "../connectToRuntime";
import { error_occurred } from "../../redux/actionCreators";

import "./style.css";

const blocklyOptions = {
  comments: true,
  disable: false,
  collapse: false,
  media: "blocks-media/",
  readOnly: false,
  rtl: false,
  scrollbars: true,
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
  constructor(props) {
    super(props);

    this.blockly = null;

    this.containerId = "editorContainer" + Math.random();

    this.activateBlock = this.activateBlock.bind(this);
    this.deactivateBlock = this.deactivateBlock.bind(this);
  }

  componentDidMount() {
    this.blockly = getCustomBlockly(
      this.props.microworld,
      () => this.props.projectDataColumns
    );
    this.workspace = this.blockly.inject(this.containerId, {
      toolbox: getBlocklyToolbox(this.props.microworld),
      ...blocklyOptions,
    });
    this.workspace.addChangeListener(() => {
      this.props.onCodeUpdated();
    });
  }

  setCode(code) {
    try {
      this.blockly.Xml.clearWorkspaceAndLoadFromXml(
        this.blockly.Xml.textToDom(code),
        this.workspace
      );
    } catch (err) {
      console.log(err);
      this.props.error_occurred(err, "Failed to load project into the editor.");
    }
  }

  getCode() {
    return this.blockly.Xml.domToText(
      this.blockly.Xml.workspaceToDom(this.workspace)
    );
  }

  activateBlock(blockId) {
    if (blockId === null) {
      this.workspace.highlightBlock(null);
    } else {
      this.workspace.highlightBlock(blockId, true);
    }
  }

  deactivateBlock(blockId) {
    this.workspace.highlightBlock(blockId, false);
  }

  render() {
    return (
      <div id={this.containerId} style={{ width: "100%", height: "100%" }}></div>
    );
  }
}

EditorComponent.propTypes = {
  onCodeUpdated: PropTypes.func,

  error_occurred: PropTypes.func,

  projectDataColumns: PropTypes.array,

  microworld: PropTypes.string.isRequired,
};

export default connect(null, { error_occurred }, null, {
  forwardRef: true,
})(connectToRuntime(EditorComponent, { data: true, visualization: false }));
