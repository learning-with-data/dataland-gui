import React, { useRef, useState } from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import Papa from "papaparse";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

import {
  PROJECT_DATA_IMPORTED,
  PROJECT_DATA_COLUMN_ADDED,
} from "../../redux/actionsTypes";

function TableViewerHeaderComponent(props) {
  const cardHeaderRef = useRef(null);

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columName, setColumnName] = useState("");

  const handleAddColumnClose = () => setShowAddColumn(false);
  const handleAddColumnShow = () => setShowAddColumn(true);
  const handleAddColumnSubmit = () => {
    props.project_data_column_added(columName);
    setShowAddColumn(false);
  };

  const handleDataImport = function (evt) {
    const file = evt.target.files[0];
    Papa.parse(file, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        props.project_data_imported(results);
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
            disabled={!props.dataLoaded}
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
  dataLoaded: PropTypes.bool,
  project_data_column_added: PropTypes.func,
  project_data_imported: PropTypes.func,
  fullScreenButtonClickHandler: PropTypes.func,
};

const mapStateToProps = function (store) {
  return {
    dataLoaded: store.projectDataState.originalDataTimestamp > 0,
  };
};

const project_data_column_added = (payload) => ({
  type: PROJECT_DATA_COLUMN_ADDED,
  payload: payload,
});

const project_data_imported = (payload) => ({
  type: PROJECT_DATA_IMPORTED,
  payload: payload,
});

export default connect(mapStateToProps, {
  project_data_column_added,
  project_data_imported,
})(TableViewerHeaderComponent);
