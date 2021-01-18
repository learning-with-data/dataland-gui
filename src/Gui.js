import React, { Component } from "react";

import { connect } from "react-redux";

import isEmpty from "lodash/isEmpty";
import PropTypes from "prop-types";

import { createProjectBlob, loadProjectBlob } from "./lib/projectio";
import ControlComponent from "./components/ControlComponent";
import EditorComponent from "./components/EditorComponent";
import ErrorNotifierComponent from "./components/ErrorNotifierComponent";
import HeaderComponent from "./components/HeaderComponent";
import TableViewerComponent from "./components/TableViewerComponent";
import VisualizationComponent from "./components/VisualizationComponent";

import { connectToRuntime } from "./components/connectToRuntime";

import {
  error_occurred,
  interpreter_started,
  interpreter_stopped,
  project_modified,
  project_saved,
} from "./redux/actionCreators";

import "./style.css";

class Gui extends Component {
  constructor(props) {
    super(props);

    this.state = {
      projectTitle: this.props.initialProjectTitle,
    };

    this.editor = React.createRef();
    this.visualizer = React.createRef();

    this.saveIntervalId = null;

    this.handleProjectImport = this.handleProjectImport.bind(this);
    this._handleBeforeUnload = this._handleBeforeUnload.bind(this);
  }

  componentDidMount() {
    // See if there is already existing code. Load if it exists.
    if (this.props.initialProject && this.props.initialProject.byteLength > 0) {
      this.handleProjectImport(this.props.initialProject);
    }

    // Set up the API save timer
    if (this.props.backend === true) {
      this.backendSaveIntervalId = setInterval(() => {
        this.saveProjectToBackend();
      }, this.props.backendCodeSaveInterval);
    }

    // Make sure a save is attempted when user leaves page (refreshes browser, or closes window)
    window.addEventListener("beforeunload", this._handleBeforeUnload);
  }

  componentWillUnmount() {
    if (this.props.backend === true) {
      this.saveProjectToBackend();
      clearInterval(this.backendSaveIntervalId);
    }
    window.removeEventListener("beforeunload", this._handleBeforeUnload);
  }

  render() {
    return (
      <>
        <ErrorNotifierComponent />
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
        <div className="gui-container">
          <div className="editor-column">
            <EditorComponent
              ref={this.editor}
              onCodeUpdated={() => {
                this.props.project_modified();
              }}
              microworld={this.props.microworld}
            />
          </div>
          <div className="viz-data-column">
            <div className="viz-container">
              <VisualizationComponent ref={this.visualizer} microworld={this.props.microworld} />
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
      console.log(err);
      this.props.error_occurred(err, "Failed to load project.");
      return;
    }

    if (!isEmpty(data)) this.props.setProjectData(data);
    // [Hack] Delay the code loading to ensure that the block menus are
    // populated with the data columns---otherwise, the menus get reset
    // to the first option
    setTimeout(() => this.editor.current.setCode(code), 100);
  }

  saveProjectToBackend() {
    if (this.props.needsSave) {
      const projectBlob = createProjectBlob(
        this.editor.current.getCode(),
        this.props.projectData
      );

      this.props.backendCodeSaveHandler(projectBlob.buffer);
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
      [
        createProjectBlob(
          this.editor.current.getCode(),
          this.props.projectData
        ),
      ],
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

  _handleBeforeUnload(event) {
    if (this.props.needsSave) {
      event.preventDefault();
      event.returnValue = "";
      if (this.props.backend) this.saveProjectToBackend();
    }
  }

  //
  // Methods that control the interpreter
  //
  async startInterpreter() {
    let interpreter;
    interpreter = await this.props.startInterpreter(
      this.editor.current.getCode(),
      "project-started",
      async () => {
        this.props.interpreter_stopped();
        interpreter.removeListener(
          "block-activated",
          this.editor.current.activateBlock
        );
        interpreter.removeListener(
          "block-deactivated",
          this.editor.current.deactivateBlock
        );
        this.editor.current.activateBlock(null);

        if (this.props.backend) {
          const thumbnailImageBuffer = await this.visualizer.current.getVisualizationImage();
          this.props.backendMetaDataSaveHandler({
            projectThumbnailBlob: thumbnailImageBuffer,
          });
        }
      }
    );
    this.props.interpreter_started();

    // Set up highlighting
    // Doing it through states/props seems to cause an occasional lag
    // in what blocks are highlighted when
    interpreter.on("block-activated", this.editor.current.activateBlock);
    interpreter.on("block-deactivated", this.editor.current.deactivateBlock);
  }

  stopInterpreter() {
    this.props.stopInterpreter();
    this.props.interpreter_stopped();
  }
}

Gui.propTypes = {
  initialProjectTitle: PropTypes.string,
  initialProject: PropTypes.instanceOf(Uint8Array),
  microworld: PropTypes.string.isRequired,

  backend: PropTypes.bool.isRequired,
  backendCodeSaveHandler: PropTypes.func,
  backendCodeSaveInterval: PropTypes.number,
  backendCodeSaveTimestamp: PropTypes.number,
  backendMetaDataSaveHandler: PropTypes.func,

  needsSave: PropTypes.bool,

  error_occurred: PropTypes.func,
  interpreter_started: PropTypes.func,
  interpreter_stopped: PropTypes.func,
  project_modified: PropTypes.func,
  project_saved: PropTypes.func,

  projectData: PropTypes.array,
  setProjectData: PropTypes.func,
  startInterpreter: PropTypes.func,
  stopInterpreter: PropTypes.func,
};

const mapStateToProps = function (store) {
  return {
    needsSave: store.projectModifiedTimeStamp > store.projectSavedTimeStamp,
  };
};

export default connect(mapStateToProps, {
  error_occurred,
  interpreter_started,
  interpreter_stopped,
  project_modified,
  project_saved,
})(connectToRuntime(Gui, { data: true, visualization: false }));
