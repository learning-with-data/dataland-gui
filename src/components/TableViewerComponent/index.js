import React, { useState } from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import Card from "react-bootstrap/Card";
import Fullscreen from "react-full-screen";

import BootstrapTable from "react-bootstrap-table-next";

import FullScreenButtonComponent from "../FullScreenButtonComponent";
import TableViewerHeaderComponent from "./header";

import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "./style.css";

function TableViewerComponent(props) {
  const [showFullScreenTable, setShowFullScreenTable] = useState(false);

  return (
    <Fullscreen
      enabled={showFullScreenTable}
      onChange={(isFull) => setShowFullScreenTable(isFull)}
    >
      <Card className="w-100 h-100">
        <TableViewerHeaderComponent>
          <FullScreenButtonComponent
            disabled={!props.keyField}
            fullScreenButtonClickHandler={() => setShowFullScreenTable(!showFullScreenTable)}
            isCurrentlyFullScreen={showFullScreenTable}
          />
        </TableViewerHeaderComponent>
        <Card.Body className="table-container">
          {!props.keyField && (
            <div className="p-4 data-placeholder w-100 h-100 justify-content-between align-items-center">
              <span className="muted">
                No data loaded. You can import data by using the &ldquo;Import
                data&rdquo; button above.
              </span>
            </div>
          )}
          {props.keyField && (
            <BootstrapTable
              keyField={props.keyField}
              data={props.data}
              columns={props.columns}
              noDataIndication="Table is Empty"
              bootstrap4={true}
              classes="data-table"
              selectRow={props.selectRow}
            />
          )}
        </Card.Body>
      </Card>
    </Fullscreen>
  );
}

TableViewerComponent.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  keyField: PropTypes.string.isRequired,
  selectRow: PropTypes.object,
};

const mapStateToProps = function (store) {
  return {
    columns: store.projectDataState.columns,
    data: store.projectDataState.data,
    keyField: store.projectDataState.keyField,
    selectRow: store.projectDataState.selectRow,
  };
};

export default connect(mapStateToProps)(TableViewerComponent);
