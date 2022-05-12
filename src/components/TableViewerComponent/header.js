import React, { useRef, useState } from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import Papa from "papaparse";

import uniqueId from "lodash/uniqueId";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";

import { connectToRuntime } from "../connectToRuntime";
import { error_occurred, project_modified } from "../../redux/actionCreators";

function TableViewerHeaderComponent(props) {
  const importBtnId = uniqueId("import-btn-");
  const importLinkId = uniqueId("import-link-");

  const cardHeaderRef = useRef(null);

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columName, setColumnName] = useState("");
  const [isCsvLoading, setIsCsvLoading] = useState(false);

  const handleAddColumnClose = () => setShowAddColumn(false);
  const handleAddColumnShow = () => setShowAddColumn(true);
  const handleAddColumnSubmit = () => {
    props.addProjectDataColumn(columName);
    setShowAddColumn(false);
  };

  const handleDataImport = function (evt) {
    setIsCsvLoading(true);
    const file = evt.target.files[0];
    Papa.parse(file, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.log("Parse error while importing CSV file.");
          console.log(results.errors);
          props.error_occurred(
            results.errors,
            "Parse error while importing CSV file."
          );
          setIsCsvLoading(false);
          return;
        }
        props.setProjectData(results.data);
        props.project_modified();
        setIsCsvLoading(false);
      },
    });
  };

  return (
    <>
      <Card.Header
        ref={cardHeaderRef}
        className="d-inline-flex justify-content-between align-items-center tableviewer-header"
      >
        <span>
          {!props.hideDataImportButton && (
            <>
              <Button
                size="sm"
                id={importBtnId}
                className="data-import-button"
                onClick={() => document.getElementById(importLinkId).click()}
              >
                {isCsvLoading && (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                      role="status"
                      className="mr-2"
                    />{" "}
                    Loading
                  </>
                )}
                {!isCsvLoading && "Import data"}
              </Button>
              <input
                type="file"
                id={importLinkId}
                className="data-import-link"
                style={{ display: "none" }}
                accept=".csv"
                onChange={(e) => handleDataImport(e)}
              />{" "}
            </>
          )}
          <Button
            disabled={props.projectData.length === 0}
            onClick={handleAddColumnShow}
            size="sm"
            variant="outline-dark"
          >
            Add column
          </Button>
        </span>

        {props.children}

        <Modal
          size="sm"
          show={showAddColumn}
          onHide={handleAddColumnClose}
          centered
          container={cardHeaderRef.current}
        >
          <Modal.Header closeButton>
            <Modal.Title>Add a new column</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Control
              type="text"
              placeholder="Column name"
              className=" mr-sm-2"
              onChange={(e) => setColumnName(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleAddColumnSubmit}>
              Add column
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Header>
    </>
  );
}

TableViewerHeaderComponent.propTypes = {
  children: PropTypes.object,
  project_data_column_added: PropTypes.func,
  fullScreenButtonClickHandler: PropTypes.func,
  hideDataImportButton: PropTypes.bool,

  setProjectData: PropTypes.func,
  addProjectDataColumn: PropTypes.func,
  projectData: PropTypes.array,

  error_occurred: PropTypes.func,
  project_modified: PropTypes.func,
};

export default connect(null, { error_occurred, project_modified })(
  connectToRuntime(TableViewerHeaderComponent, {
    data: true,
    visualization: false,
  })
);
