import React, { useRef, useState } from "react";

import PropTypes from "prop-types";

import Papa from "papaparse";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

import { connectToRuntime } from "../connectToRuntime";


// TODO: Error handling, and loading indicator for large CSVs
function TableViewerHeaderComponent(props) {
  const cardHeaderRef = useRef(null);

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columName, setColumnName] = useState("");

  const handleAddColumnClose = () => setShowAddColumn(false);
  const handleAddColumnShow = () => setShowAddColumn(true);
  const handleAddColumnSubmit = () => {
    props.addProjectDataColumn(columName);
    setShowAddColumn(false);
  };

  const handleDataImport = function (evt) {
    const file = evt.target.files[0];
    Papa.parse(file, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        props.setProjectData(results.data);
      },
    });
  };

  return (
    <>
      <Card.Header
        ref={cardHeaderRef}
        className="d-inline-flex justify-content-between align-items-center"
      >
        <span>
          <Button
            size="sm"
            id="btn-import-data"
            onClick={() => document.getElementById("dataImportLink").click()}
          >
            Import data
          </Button>
          <input
            type="file"
            id="dataImportLink"
            style={{ display: "none" }}
            accept=".csv"
            onChange={(e) => handleDataImport(e)}
          />{" "}
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

  setProjectData: PropTypes.func,
  addProjectDataColumn: PropTypes.func,
  projectData: PropTypes.array,
};

export default connectToRuntime(TableViewerHeaderComponent, {
  data: true,
  visualization: false,
});
