import React from "react";

import PropTypes from "prop-types";

import Card from "react-bootstrap/Card";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { connectToRuntime } from "../connectToRuntime";

import FullScreenButtonComponent from "../FullScreenButtonComponent";
import TableViewerHeaderComponent from "./header";
import TableView from "./tableview";

import "./style.css";

function TableViewerComponent(props) {
  const handle = useFullScreenHandle();

  return (
    <FullScreen handle={handle}>
      <Card className="w-100 h-100">
        <TableViewerHeaderComponent hideDataImportButton={props.hideDataImportButton}>
          <FullScreenButtonComponent
            disabled={Array.isArray(props.projectData) && props.projectData.length===0}
            handle={handle}
          />
        </TableViewerHeaderComponent>
        <Card.Body className="table-container">
          {props.projectData && (
            <TableView
              columns={props.projectDataColumns}
              data={props.projectData}
            />
          )}
        </Card.Body>
      </Card>
    </FullScreen>
  );
}

TableViewerComponent.propTypes = {
  projectData: PropTypes.array,
  projectDataColumns: PropTypes.array,
  hideDataImportButton: PropTypes.bool,
};

export default connectToRuntime(TableViewerComponent, {
  data: true,
  visualization: false,
});
