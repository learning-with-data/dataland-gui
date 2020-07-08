import React, { useState } from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import { VegaLite } from "react-vega";
import Card from "react-bootstrap/Card";

import "./style.css";


function VisualizationComponent(props) {
  // eslint-disable-next-line no-unused-vars
  const [view, setView] = useState(null);

  return (
    <Card className="w-100 h-100">
      {/* <Card.Header className="text-right">
      </Card.Header> */}
      <Card.Body className="visualization">
        <VegaLite
          spec={props.visualizationSpec}
          actions={false}
          className="h-100 w-100"
          onNewView={(v) => setView(v)}
        />
      </Card.Body>
    </Card>
  );
}

VisualizationComponent.propTypes = {
  visualizationSpec: PropTypes.object,
};

const mapStateToProps = function (store) {
  return {
    visualizationSpec: store.visualizationState.visualizationSpec,
  };
};

export default connect(mapStateToProps)(VisualizationComponent);
