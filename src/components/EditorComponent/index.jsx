import React, { Component } from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import * as Blockly from "blockly/core";

import DataLandTheme from "../../lib/blockly/theme";
import getBlocklyToolbox from "../../lib/blockly/toolbox";

import { connectToRuntime } from "../connectToRuntime";
import { error_occurred } from "../../redux/actionCreators";

import "./style.css";

const blocklyInjectionOptions = {
  comments: true,
  disable: false,
  collapse: false,
  media: "/blocks-media/node_modules/blockly/media/",
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
    this.resize = this.resize.bind(this);
    this.loadJsonCode = this.loadJsonCode.bind(this);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
  }

  componentDidMount() {
    this.workspace = Blockly.inject(this.container.current, {
      toolbox: getBlocklyToolbox(this.props.microworld),
      ...blocklyInjectionOptions,
      ...this.props.blocklyInjectionOptions,
    });
    this.workspace.addChangeListener((event) => {
      this.props.onCodeUpdated();
      // Deal with variables changing
      switch (event.type) {
        case Blockly.Events.VAR_CREATE:
          this.props.addVariable(event.varName);
          break;
        case Blockly.Events.VAR_DELETE:
          this.props.deleteVariable(event.varName);
          break;
        case Blockly.Events.VAR_RENAME:
          this.props.renameVariable(event.oldName, event.newName);
          break;
        default:
          break;
      }
    });

    // window.addEventListener("resize", this.resize, false);
    this.resizeObserver.observe(this.container.current);
  }

  setCode(code) {
    try {
      Blockly.Xml.clearWorkspaceAndLoadFromXml(
        Blockly.utils.xml.textToDom(code),
        this.workspace
      );
    } catch (err) {
      console.error(err);
      this.props.error_occurred(err, "Failed to load project into the editor.");
    }
  }

  getCode() {
    return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(this.workspace));
  }

  getWorkspace() {
    return this.workspace;
  }

  loadJsonCode(json) {
    try {
      Blockly.serialization.workspaces.load(json, this.workspace);
      this.recenterBlocks();
    } catch (err) {
      console.error(err);
      this.props.error_occurred(err, "Failed to load AI generated code.");
    }
  }

  recenterBlocks() {
    const blocks = this.workspace.getTopBlocks(true);
    if (blocks.length === 0) return;

    // Compute the center of the visible workspace area in workspace coordinates.
    // metrics.viewLeft/viewTop and viewWidth/viewHeight are in pixels (relative
    // to the workspace origin); divide by the scale to get workspace units.
    const metrics = this.workspace.getMetrics();
    const scale = this.workspace.getScale();
    const centerX = (metrics.viewLeft + metrics.viewWidth / 2) / scale;
    const centerY = (metrics.viewTop + metrics.viewHeight / 2) / scale;

    // Calculate the total bounding box of all top-level blocks
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const block of blocks) {
      const xy = block.getRelativeToSurfaceXY();
      const { width, height } = block.getHeightWidth();
      minX = Math.min(minX, xy.x);
      minY = Math.min(minY, xy.y);
      maxX = Math.max(maxX, xy.x + width);
      maxY = Math.max(maxY, xy.y + height);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Offset to center the content's bounding box around the workspace center
    const offsetX = centerX - contentWidth / 2 - minX;
    const offsetY = centerY - contentHeight / 2 - minY;

    for (const block of blocks) {
      block.moveBy(offsetX, offsetY);
    }
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

  resize() {
    var editorContainer = this.container.current;
    editorContainer.style.x = editorContainer.parentElement.offsetLeft + "px";
    editorContainer.style.y = editorContainer.parentElement.offsetTop + "px";
    editorContainer.style.width =
      editorContainer.parentElement.offsetWidth + "px";
    editorContainer.style.height =
      editorContainer.parentElement.offsetHeight + "px";

    Blockly.svgResize(this.workspace);
  }

  componentDidUpdate() {
    this.resize();
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
  blocklyInjectionOptions: PropTypes.object,

  addVariable: PropTypes.func,
  deleteVariable: PropTypes.func,
  renameVariable: PropTypes.func,
};

export default connect(null, { error_occurred }, null, {
  forwardRef: true,
})(
  connectToRuntime(EditorComponent, {
    data: true,
    variables: false,
    visualization: false,
  })
);
