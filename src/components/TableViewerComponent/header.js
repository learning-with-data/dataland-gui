import React, { useState } from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

import {
  //    PROJECT_DATA_IMPORTED,
  PROJECT_DATA_COLUMN_ADDED,
} from "../../redux/actionsTypes";

function TableViewerHeaderComponent(props) {
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columName, setColumnName] = useState("");

  const handleAddColumnClose = () => setShowAddColumn(false);
  const handleAddColumnShow = () => setShowAddColumn(true);
  const handleAddColumnSubmit = () => {
    props.project_data_code_added(columName);
    setShowAddColumn(false);
  };

  return (
    <>
      <Card.Header className="d-inline-flex justify-content-between align-items-center">
        <span>
          <Button
            disabled={!props.dataLoaded}
            onClick={handleAddColumnShow}
            size="sm"
            variant="outline-dark"
          >
            Add column
          </Button>
        </span>
      </Card.Header>

      <Modal show={showAddColumn} onHide={handleAddColumnClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add a new column to the data table</Modal.Title>
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
    </>
  );
}

TableViewerHeaderComponent.propTypes = {
  dataLoaded: PropTypes.bool,
  project_data_code_added: PropTypes.func,
};

const mapStateToProps = function (store) {
  return {
    dataLoaded: store.projectDataState.originalDataTimestamp > 0,
  };
};

const project_data_code_added = (payload) => ({
  type: PROJECT_DATA_COLUMN_ADDED,
  payload: payload,
});

export default connect(mapStateToProps, { project_data_code_added })(
  TableViewerHeaderComponent
);
