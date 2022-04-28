import React from "react";

import PropTypes from "prop-types";

import { Badge, Card, ListGroup } from "react-bootstrap";

import { connectToRuntime } from "../connectToRuntime";


import "./style.css";

function MonitorComponent(props) {
  return (
    <Card className="w-100 h-100">
      <Card.Body>
        {Object.keys(props.projectVariables).length > 0 ? (
          <ListGroup variant="flush">
            <ListGroup.Item className="d-flex justify-content-between align-items-start">
              <span className="ms-2 me-auto fw-bold">Variable name</span>
              <span>Value</span>
            </ListGroup.Item>

            {Object.keys(props.projectVariables).map((variable) => (
              <ListGroup.Item
                key={variable}
                className="d-flex justify-content-between align-items-start"
              >
                <span className="ms-2 me-auto">{variable}</span>
                <Badge className="variable-monitor-value" pill bg="secondary">
                  {props.projectVariables[variable]}
                </Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <div className="w-100 h-100">
            <span className="muted small">
              No variables have been defined yet. You can create variables by
              going to the &ldquo;Variables&rdquo; category in the blocks
              toolbox to the left.
            </span>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

MonitorComponent.propTypes = {
  projectVariables: PropTypes.object,
};

export default connectToRuntime(MonitorComponent, {
  data: false,
  variables: true,
  visualization: false,
});
