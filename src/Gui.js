import React, { Component } from "react";

import { connect, ReactReduxContext } from "react-redux";

import PropTypes from "prop-types";
import { parseString } from "xml2js";
import { Interpreter } from "dataland-interpreter";
import { VegaLite } from "react-vega";

import { createProjectBlob, loadProjectBlob } from "./lib/projectio";
import ControlComponent from "./components/ControlComponent";
import EditorComponent from "./components/EditorComponent";
import TableViewerComponent from "./components/TableViewerComponent";
import HeaderComponent from "./components/HeaderComponent";
import PrimTable from "./lib/primitives";

import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

class Gui extends Component {
  static contextType = ReactReduxContext;

  constructor(props, context) {
    super(props, context);

    this.state = {
      busy: false,
      interpreterState: "STOPPED",
      backendSaveRequestTime: 0,
    };

    this.interpreter = null;
    this.saveIntervalId = null;

    this.handleCodeImport = this.handleCodeImport.bind(this);
  }

  componentDidMount() {
    // See if there is already existing code. Load if it exists.
    if (this.props.initialCode && this.props.initialCode.byteLength > 0) {
      this.handleCodeImport(this.props.initialCode);
    }

    // Set up the API save timer
    if (this.props.backend === true) {
      this.backendSaveIntervalId = setInterval(() => {
        this.saveCodeToBackend();
      }, this.props.backendCodeSaveInterval);
    }

    // Make sure a save is attempted when user leaves page (refreshes browser, or closes window)
    if (this.props.backend === true) {
      window.addEventListener("beforeunload", () =>
        this.saveCodeToBackend(false)
      );
    }
  }

  componentWillUnmount() {
    if (this.props.backend === true) {
      this.saveCodeToBackend(false);
      clearInterval(this.backendSaveIntervalId);
    }
  }

  render() {
    return (
      <>
        <HeaderComponent
          projectTitle={this.props.projectTitle}
          backend={this.props.backend}
          backendMetaDataSaveHandler={this.props.backendMetaDataSaveHandler}
          lastSaveTimestamp={this.props.backendCodeSaveTimestamp}
          lastSaveRequestTimeStamp={this.state.backendSaveRequestTime}
        >
          <ControlComponent
            handleProjectSavePress={() => this.handleCodeSave()}
            handleProjectLoadPress={(e) => this.handleProjectFileImport(e)}
            handleStartPress={() => this.startInterpreter()}
            handleStopPress={() => this.stopInterpreter()}
          />
        </HeaderComponent>
        <div className={`gui-container ${this.state.busy ? "busy" : ""}`}>
          <div className="editor-column">
            <EditorComponent key={this.props.codeImportTimestamp} />
          </div>
          <div className="viz-data-column">
            <div className="viz-container">
              <VegaLite
                spec={this.props.visualizationSpec}
                actions={false}
                className="h-100 w-100"
              />
            </div>
            <div className="data-container">
              <TableViewerComponent />
            </div>
          </div>
        </div>
      </>
    );
  }

  async parseCode() {
    return new Promise((resolve, reject) => {
      parseString(
        this.props.code,
        { explicitArray: false, mergeAttrs: true },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  async startInterpreter() {
    this.setState({ busy: true });
    const parsedCode = await this.parseCode();
    this.interpreter = new Interpreter(
      parsedCode.xml,
      PrimTable(this.context.store),
      () => this.setState({ interpreterState: "STOPPED", busy: false })
    );
    // this.interpreter.on("block-activated", (blockId) => {
    //   this.setState({ activeBlock: blockId });
    // });
    // this.interpreter.on("block-deactivated", (blockId) => {
    //   this.setState({ inactiveBlock: blockId });
    // });

    this.interpreter.start("project-started");
    this.setState({ interpreterState: "RUNNING" });
  }

  stopInterpreter() {
    this.interpreter.stop();
    this.setState({ interpreterState: "STOPPED" });
  }

  handleCodeImport(data) {
    // Called when user loads a project manually, or code comes from backend
    loadProjectBlob(this.context.store, data);
  }

  saveCodeToBackend(shouldUpdateState = true) {
    // Checks to see if save happened after code/data update
    if (
      this.state.backendSaveRequestTime < this.props.codeUpdateTimestamp ||
      this.state.backendSaveRequestTime < this.props.originalDataTimestamp
    ) {
      this.props.backendCodeSaveHandler(createProjectBlob(this.context.store));
      if (shouldUpdateState === true) {
        this.setState({ backendSaveRequestTime: Date.now() });
      }
    }
  }

  handleProjectFileImport(evt) {
    if (this.props.code !== "") {
      const result = window.confirm(
        "This action will overwrite all the code currently in the editor. Do you want to continue?"
      );
      if (result === false) {
        return;
      }
    }
    const file = evt.target.files[0];
    const reader = new FileReader();
    reader.onload = (file) => {
      this.handleCodeImport(file.target.result);
    };
    reader.readAsBinaryString(file);
  }

  handleCodeSave() {
    // When download project is clicked
    var projectBlob = new Blob([createProjectBlob(this.context.store)], {
      type: "application/zlib",
    });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(
        projectBlob,
        this.state.projectTitle + ".dbp"
      );
    } else {
      var blobUrl = window.URL.createObjectURL(projectBlob);
      var elem = window.document.createElement("a");
      elem.href = blobUrl;
      elem.download = this.props.projectTitle + ".dbp";
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);

      // Make this thing expire after a while
      // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL#Memory_management
      // Assumption is that file is downloaded after 1 minute
      window.setTimeout(window.URL.revokeObjectURL, 60000, blobUrl);
    }
  }
}

Gui.propTypes = {
  projectTitle: PropTypes.string,
  initialCode: PropTypes.instanceOf(Uint8Array),

  backend: PropTypes.bool.isRequired,
  backendCodeSaveHandler: PropTypes.func,
  backendCodeSaveInterval: PropTypes.number,
  backendCodeSaveTimestamp: PropTypes.number,
  backendMetaDataSaveHandler: PropTypes.func,

  code: PropTypes.string,
  codeImportTimestamp: PropTypes.number,
  codeUpdateTimestamp: PropTypes.number,
  originalDataTimestamp: PropTypes.number,
  visualizationSpec: PropTypes.object,

  project_data_imported: PropTypes.func,
};

const mapStateToProps = function (store) {
  return {
    code: store.projectCodeState.code,
    codeImportTimestamp: store.projectCodeState.codeImportTimestamp,
    codeUpdateTimestamp: store.projectCodeState.codeUpdateTimestamp,
    originalDataTimestamp: store.projectDataState.originalDataTimestamp,
    visualizationSpec: store.visualizationState.visualizationSpec,
  };
};

export default connect(mapStateToProps)(Gui);
