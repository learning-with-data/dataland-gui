import cloneDeep from "lodash/cloneDeep";

import {
  BLOCKARG_VISUALIZATION_COLOR,
  BLOCKARG_VISUALIZATION_COLUMN,
  BLOCKARG_VISUALIZATION_MARK,
  BLOCKARG_VISUALIZATION_TITLE,
} from "../blockly/constants";


class VisualizationPrimTable {
  constructor(runtime) {
    this.runtime = runtime;

    this.mark = {
      type: "point",
      color: "#4682b4",
      tooltip: { content: "data" },
    };

    this.visualization_set_title = (b) => this.primVisualizationSetTitle(b);
    this.visualization_clear = () => this.primVisualizationClear();

    this.visualization_set_x = (b) => this.primVisualizationSetX(b);
    this.visualization_set_y = (b) => this.primVisualizationSetY(b);
    this.visualization_set_size = (b) => this.primVisualizationSetSize(b);

    this.visualization_set_color_as_static = (b) =>
      (this.mark.color = b.thread.getBlockArg(b, BLOCKARG_VISUALIZATION_COLOR));
    this.visualization_set_color_as_var = (b) =>
      this.primVisualizationSetColor(b);

    this.visualization_set_mark = (b) =>
      (this.mark.type = b.thread.getBlockArg(b, BLOCKARG_VISUALIZATION_MARK));
  }

  _guess_encoding_type(data, column) {
    const first = data[0][column];
    if (typeof first === "number") return "quantitative";
    if (typeof first === "string") return "nominal"; // TODO: Is there a way to figure out if ordinal?
    if (first instanceof Date) return "temporal";

    console.warn(`Could not detect encoding type for ${column}, falling back to quantitative.`);
    return "quantitative";
  }

  primVisualizationSetTitle(block) {
    const title = block.thread.getBlockArg(block, BLOCKARG_VISUALIZATION_TITLE);
    const spec = this.runtime.getVisualizationSpec();

    const newSpec = { ...spec, title };

    this.runtime.setVisualizationSpec(newSpec);
  }

  primVisualizationClear() {
    this.runtime.dispatchVisualizationUpdate(true);
  }

  primVisualizationSetX(block) {
    const column = block.thread.getBlockArg(
      block,
      BLOCKARG_VISUALIZATION_COLUMN
    );

    const data = this.runtime.getCurrentData();
    const spec = this.runtime.getVisualizationSpec();

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.x !== undefined) {
      unitSpec = {
        data: { values: data },
        mark: this.mark,
        encoding: {},
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.x = {
      field: column,
      type: this._guess_encoding_type(data, column),
    };

    var newLayerSpec;
    if (newLayer) {
      newLayerSpec = spec.layer.concat(unitSpec);
    } else {
      newLayerSpec = spec.layer.map((unit) => {
        if (unit.name == unitSpec.name) return unitSpec;
        return unit;
      });
    }

    const newSpec = { ...spec, layer: newLayerSpec };

    this.runtime.setVisualizationSpec(newSpec);
  }

  primVisualizationSetY(block) {
    const column = block.thread.getBlockArg(
      block,
      BLOCKARG_VISUALIZATION_COLUMN
    );

    const data = this.runtime.getCurrentData();
    const spec = this.runtime.getVisualizationSpec();

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.y !== undefined) {
      unitSpec = {
        data: { values: data },
        mark: this.mark,
        encoding: {},
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.y = {
      field: column,
      type: this._guess_encoding_type(data, column),
    };

    var newLayerSpec;
    if (newLayer) {
      newLayerSpec = spec.layer.concat(unitSpec);
    } else {
      newLayerSpec = spec.layer.map((unit) => {
        if (unit.name == unitSpec.name) return unitSpec;
        return unit;
      });
    }

    const newSpec = { ...spec, layer: newLayerSpec };

    this.runtime.setVisualizationSpec(newSpec);
  }

  primVisualizationSetSize(block) {
    const column = block.thread.getBlockArg(
      block,
      BLOCKARG_VISUALIZATION_COLUMN
    );

    const data = this.runtime.getCurrentData();
    const spec = this.runtime.getVisualizationSpec();

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.size !== undefined) {
      unitSpec = {
        data: { values: data },
        mark: this.mark,
        encoding: {},
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.size = {
      field: column,
      type: this._guess_encoding_type(data, column),
    };

    var newLayerSpec;
    if (newLayer) {
      newLayerSpec = spec.layer.concat(unitSpec);
    } else {
      newLayerSpec = spec.layer.map((unit) => {
        if (unit.name == unitSpec.name) return unitSpec;
        return unit;
      });
    }

    const newSpec = { ...spec, layer: newLayerSpec };

    this.runtime.setVisualizationSpec(newSpec);
  }

  primVisualizationSetColor(block) {
    const column = block.thread.getBlockArg(
      block,
      BLOCKARG_VISUALIZATION_COLUMN
    );

    const data = this.runtime.getCurrentData();
    const spec = this.runtime.getVisualizationSpec();

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.color !== undefined) {
      unitSpec = {
        data: { values: data },
        mark: this.mark,
        encoding: {},
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.color = {
      field: column,
      type: this._guess_encoding_type(data, column),
    };

    var newLayerSpec;
    if (newLayer) {
      newLayerSpec = spec.layer.concat(unitSpec);
    } else {
      newLayerSpec = spec.layer.map((unit) => {
        if (unit.name == unitSpec.name) return unitSpec;
        return unit;
      });
    }

    const newSpec = { ...spec, layer: newLayerSpec };

    this.runtime.setVisualizationSpec(newSpec);
  }
}

export default VisualizationPrimTable;
