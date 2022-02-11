import React, { Component } from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import * as Blockly from "blockly/core";

import DataLandTheme from "../../lib/blockly/theme";
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

    this.workspace = null;
    this.container = React.createRef();

    this.activateBlock = this.activateBlock.bind(this);
    this.deactivateBlock = this.deactivateBlock.bind(this);
  }

  componentDidMount() {
    this.workspace = Blockly.inject(this.container.current, {
      toolbox: getBlocklyToolbox(this.props.microworld),
      ...blocklyOptions,
    });
    this.workspace.addChangeListener(() => {
      this.props.onCodeUpdated();
    });
  }

  setCode(code) {
    try {
      Blockly.Xml.clearWorkspaceAndLoadFromXml(
        Blockly.Xml.textToDom(code),
        this.workspace
      );
    } catch (err) {
      console.log(err);
      this.props.error_occurred(err, "Failed to load project into the editor.");
    }
  }

  getCode() {
    return Blockly.Xml.domToText(
      Blockly.Xml.workspaceToDom(this.workspace)
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
      <div
        ref={this.container}
        data-projectdatacolumns={JSON.stringify(this.props.projectDataColumns)}
        className="editorContainer"
      ></div>
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
