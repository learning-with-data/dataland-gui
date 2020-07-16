import React, { Component } from "react";

import PropTypes from "prop-types";

import { VegaLite } from "react-vega";
import Card from "react-bootstrap/Card";

import { connectToRuntime } from "../connectToRuntime";

import "./style.css";

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
          <VegaLite
            spec={this.props.projectVisualizationSpec}
            actions={false}
            className="h-100 w-100"
            onParseError={(e) => console.log(e)}
            onNewView={(v) => (this._view = v)}
          />
        </Card.Body>
      </Card>
    );
  }

  async _getImageBlobFromView() {
    const viewCanvas = await this._view.toCanvas(
      320 / this._view.width ()// We want a 320px wide image
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
