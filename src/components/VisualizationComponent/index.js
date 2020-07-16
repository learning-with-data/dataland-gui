import React, { Component, Suspense } from "react";

import PropTypes from "prop-types";

import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";

import { connectToRuntime } from "../connectToRuntime";

import "./style.css";

const VegaLite = React.lazy(() =>
  import("react-vega").then((module) => ({ default: module.VegaLite }))
);

class VisualizationComponent extends Component {
  constructor(props) {
    super(props);
    this._view = null;
  }

  render() {
    return (
      <Card className="w-100 h-100">
        {/* <Card.Header className="text-right">
      </Card.Header> */}
        <Card.Body className="visualization">
          <Suspense
            fallback={
              <div className="h-100 w-100 d-flex justify-content-center align-items-center">
                <Spinner animation="border" role="status">
                  <span className="sr-only">Loading...</span>
                </Spinner>
              </div>
            }
          >
            <VegaLite
              spec={this.props.projectVisualizationSpec}
              actions={false}
              className="h-100 w-100"
              onParseError={(e) => console.log(e)}
              onNewView={(v) => (this._view = v)}
            />
          </Suspense>
        </Card.Body>
      </Card>
    );
  }

  async _getImageBlobFromView() {
    const viewCanvas = await this._view.toCanvas(
      320 / this._view.width() // We want a 320px wide image
    );
    return new Promise((resolve) => {
      viewCanvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  }

  async getVisualizationImage() {
    if (this._view) {
      try {
        const imageBlob = await this._getImageBlobFromView();
        return await imageBlob.arrayBuffer();
      } catch (err) {
        console.log(err);
      }
    }

    return null;
  }
}

VisualizationComponent.propTypes = {
  projectVisualizationSpec: PropTypes.object,
};

export default connectToRuntime(VisualizationComponent, {
  data: false,
  visualization: true,
});
