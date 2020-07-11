import React, { Component } from "react";

import { connect, ReactReduxContext } from "react-redux";

import isEmpty from "lodash/isEmpty";
import PropTypes from "prop-types";
import { parseString } from "xml2js";
import { Interpreter } from "dataland-interpreter";

import { createProjectBlob, loadProjectBlob } from "./lib/projectio";
import ControlComponent from "./components/ControlComponent";
import EditorComponent from "./components/EditorComponent";
import HeaderComponent from "./components/HeaderComponent";
import TableViewerComponent from "./components/TableViewerComponent";
import VisualizationComponent from "./components/VisualizationComponent";

import {
  GUI_ERROR_OCCURRED,
  GUI_PROJECT_MODIFIED,
  GUI_PROJECT_SAVED,
  PROJECT_DATA_IMPORTED,
} from "./redux/actionsTypes";

import PrimTable from "./lib/primitives";

import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

class Gui extends Component {
  static contextType = ReactReduxContext;

  constructor(props, context) {
    super(props, context);

    this.state = {
      initialProjectCode: "",
      projectCode: "",
      projectTitle: this.props.initialProjectTitle,
      interpreterState: "STOPPED",
      projectImportTimeStamp: Date.now(),
    };

    this.editorWorkspace = null;
    this.setEditorWorkspaceRef = (editor) => {
      if (editor) this.editorWorkspace = editor.workspace;
    };

    this.interpreter = null;
    this.saveIntervalId = null;

    this.handleProjectImport = this.handleProjectImport.bind(this);
  }

  componentDidMount() {
    // See if there is already existing code. Load if it exists.
    if (this.props.initialProject && this.props.initialProject.byteLength > 0) {
      this.handleProjectImport(this.props.initialProject);
    }

    // Set up the API save timer
    if (this.props.backend === true) {
      this.backendSaveIntervalId = setInterval(() => {
        this.saveCodeToBackend();
      }, this.props.backendCodeSaveInterval);
    }

    // Make sure a save is attempted when user leaves page (refreshes browser, or closes window)
    window.addEventListener("beforeunload", (event) => {
      if (this.props.needsSave) {
        event.preventDefault();
        event.returnValue = "";
        if (this.props.backend) this.saveCodeToBackend();
      }
    });
  }

  componentWillUnmount() {
    if (this.props.backend === true) {
      this.saveCodeToBackend();
      clearInterval(this.backendSaveIntervalId);
    }
  }

  render() {
    return (
      <>
        <HeaderComponent
          initialProjectTitle={this.props.initialProjectTitle}
          onProjectTitleChange={(t) => {
            if (this.props.backend)
              this.props.backendMetaDataSaveHandler({ title: t });
            this.setState({ projectTitle: t });
          }}
          lastSaveTimestamp={this.props.backendCodeSaveTimestamp}
          lastSaveRequestTimeStamp={this.state.backendSaveRequestTime}
        >
          <ControlComponent
            handleProjectSavePress={() => this.handleProjectFileSave()}
            handleProjectLoadPress={(e) => this.handleProjectFileLoad(e)}
            handleStartPress={() => this.startInterpreter()}
            handleStopPress={() => this.stopInterpreter()}
          />
        </HeaderComponent>
        <div className={`gui-container ${this.state.busy ? "busy" : ""}`}>
          <div className="editor-column">
            <EditorComponent
              initialCode={this.state.initialProjectCode}
              key={this.state.projectImportTimeStamp}
              ref={this.setEditorWorkspaceRef}
              onCodeUpdated={(c) => {
                this.setState({ code: c });
                this.props.project_modified();
              }}
            />
          </div>
          <div className="viz-data-column">
            <div className="viz-container">
              <VisualizationComponent />
            </div>
            <div className="data-container">
              <TableViewerComponent />
            </div>
          </div>
        </div>
      </>
    );
  }

  //
  // Methods that save/load/import/export projects
  //
  handleProjectImport(blob) {
    // Called when user loads a project manually, or code comes from backend
    var code, data;

    try {
      [code, data] = loadProjectBlob(blob);
    } catch (err) {
      this.props.error_occurred(err, "Failed to load project");
    }

    if (!isEmpty(data)) this.props.data_imported(data);
    this.setState({
      initialProjectCode: code,
      projectImportTimeStamp: Date.now(),
    });
  }

  saveProjectToBackend() {
    if (this.props.needsSave) {
      this.props.backendCodeSaveHandler(
        createProjectBlob(this.state.code, this.props.projectData)
      );
      this.props.project_saved();
    }
  }

  handleProjectFileLoad(evt) {
    if (this.state.projectCode !== "" && isEmpty(this.props.projectData)) {
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
      this.handleProjectImport(file.target.result);
    };
    reader.readAsBinaryString(file);
    this.props.project_modified();
  }

  handleProjectFileSave() {
    var projectBlob = new Blob(
      [createProjectBlob(this.state.code, this.props.projectData)],
      {
        type: "application/zlib",
      }
    );
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(
        projectBlob,
        this.state.projectTitle + ".dbp"
      );
    } else {
      var blobUrl = window.URL.createObjectURL(projectBlob);

      var elem = window.document.createElement("a");
      elem.setAttribute("id", "download-link");
      elem.href = blobUrl;
      elem.download = this.state.projectTitle + ".dbp";
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);

      // Make this thing expire after a while
      // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL#Memory_management
      // Assumption is that file is downloaded after 1 minute
      window.setTimeout(window.URL.revokeObjectURL, 60000, blobUrl);
      this.props.project_saved();
    }
  }

  //
  // Methods that control the interpreter
  //
  async parseCode() {
    return new Promise((resolve, reject) => {
      parseString(
        this.state.code,
        { explicitArray: false, mergeAttrs: true },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  async startInterpreter() {
    const parsedCode = await this.parseCode();
    this.interpreter = new Interpreter(
      parsedCode.xml,
      PrimTable(this.context.store),
      () => {
        this.setState({ interpreterState: "STOPPED", busy: false });
        this.editorWorkspace.highlightBlock(null);
      }
    );
    this.interpreter.on("block-activated", (blockId) => {
      this.editorWorkspace.highlightBlock(blockId, true);
    });
    this.interpreter.on("block-deactivated", (blockId) => {
      this.editorWorkspace.highlightBlock(blockId, false);
    });

    this.interpreter.start("project-started");
    this.setState({ interpreterState: "RUNNING" });
  }

  stopInterpreter() {
    this.interpreter.stop();
    this.setState({ interpreterState: "STOPPED" });
  }
}

Gui.propTypes = {
  initialProjectTitle: PropTypes.string,
  initialProject: PropTypes.instanceOf(Uint8Array),

  backend: PropTypes.bool.isRequired,
  backendCodeSaveHandler: PropTypes.func,
  backendCodeSaveInterval: PropTypes.number,
  backendCodeSaveTimestamp: PropTypes.number,
  backendMetaDataSaveHandler: PropTypes.func,

  needsSave: PropTypes.bool,
  projectData: PropTypes.object,

  data_imported: PropTypes.func,
  error_occurred: PropTypes.func,
  project_modified: PropTypes.func,
  project_saved: PropTypes.func,
};

const mapStateToProps = function (store) {
  return {
    needsSave:
      store.guiState.projectModifiedTimeStamp >
      store.guiState.projectSavedTimeStamp,
    projectData: store.projectDataState.originalData,
  };
};

const data_imported = (data) => ({
  type: PROJECT_DATA_IMPORTED,
  payload: data,
});

const error_occurred = (error, message) => ({
  type: GUI_ERROR_OCCURRED,
  payload: { error, message },
});

const project_modified = () => ({
  type: GUI_PROJECT_MODIFIED,
});

const project_saved = () => ({
  type: GUI_PROJECT_SAVED,
});

export default connect(mapStateToProps, {
  data_imported,
  error_occurred,
  project_modified,
  project_saved,
})(Gui);
