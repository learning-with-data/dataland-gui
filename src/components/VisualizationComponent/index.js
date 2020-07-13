import React from "react";

import PropTypes from "prop-types";

import { VegaLite } from "react-vega";
import Card from "react-bootstrap/Card";

import { connectToRuntime } from "../connectToRuntime";

import "./style.css";

const VisualizationComponent = React.memo((props) => {
  return (
    <Card className="w-100 h-100">
      {/* <Card.Header className="text-right">
      </Card.Header> */}
      <Card.Body className="visualization">
        <VegaLite
          spec={props.projectVisualizationSpec}
          actions={false}
          className="h-100 w-100"
          onParseError={(e) => console.log(e)}
        />
      </Card.Body>
    </Card>
  );
});

VisualizationComponent.propTypes = {
  projectVisualizationSpec: PropTypes.object,
};

VisualizationComponent.displayName = "VisualizationComponent";

export default connectToRuntime(VisualizationComponent, {
  data: false,
  visualization: true,
});
