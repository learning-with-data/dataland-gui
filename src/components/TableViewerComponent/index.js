import React, { useState } from "react";

import PropTypes from "prop-types";

import Card from "react-bootstrap/Card";
import Fullscreen from "react-full-screen";

import { connectToRuntime } from "../connectToRuntime";

import FullScreenButtonComponent from "../FullScreenButtonComponent";
import TableViewerHeaderComponent from "./header";
import TableView from "./tableview";

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
            disabled={!props.projectData}
            fullScreenButtonClickHandler={() =>
              setShowFullScreenTable(!showFullScreenTable)
            }
            isCurrentlyFullScreen={showFullScreenTable}
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
    </Fullscreen>
  );
}

TableViewerComponent.propTypes = {
  projectData: PropTypes.array,
  projectDataColumns: PropTypes.array,
};

export default connectToRuntime(TableViewerComponent, {
  data: true,
  visualization: false,
});
