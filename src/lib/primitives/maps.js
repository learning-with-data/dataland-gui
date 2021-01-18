import cloneDeep from "lodash/cloneDeep";

import {
  BLOCKARG_MAPS_COLOR,
  BLOCKARG_MAPS_COLUMN,
} from "../blockly/constants";

class MapsPrimTable {
  constructor(runtime) {
    this.runtime = runtime;

    this.marker_color = "#4682b4";

    this.maps_clear = () => this.primMapsClear();

    this.maps_set_latitude = (b) => this.primMapsSetLatitude(b);
    this.maps_set_longitude = (b) => this.primMapsSetLongitude(b);
    this.maps_set_size = (b) => this.primMapsSetSize(b);

    this.maps_set_color_as_static = (b) =>
      (this.marker_color = b.thread.getBlockArg(b, BLOCKARG_MAPS_COLOR));
  }

  primMapsClear() {
    this.runtime.dispatchVisualizationUpdate(true);
  }

  primMapsSetLatitude(block) {
    const column = block.thread.getBlockArg(block, BLOCKARG_MAPS_COLUMN);

    const data = this.runtime.getCurrentData();
    const spec = this.runtime.getVisualizationSpec();

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.latitude !== undefined) {
      unitSpec = {
        data: { values: data },
        encoding: { color: this.marker_color },
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.latitude = {
      field: column,
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

  primMapsSetLongitude(block) {
    const column = block.thread.getBlockArg(block, BLOCKARG_MAPS_COLUMN);

    const data = this.runtime.getCurrentData();
    const spec = this.runtime.getVisualizationSpec();

    var unitSpec = cloneDeep(spec.layer.slice(-1)[0]);
    var newLayer = false;

    if (unitSpec === undefined || unitSpec.encoding.longitude !== undefined) {
      unitSpec = {
        data: { values: data },
        encoding: { color: this.marker_color },
        name: Math.random().toString(),
      };
      newLayer = true;
    }

    unitSpec.encoding.longitude = {
      field: column,
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

  primMapsSetSize(block) {
    const column = block.thread.getBlockArg(block, BLOCKARG_MAPS_COLUMN);

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

export default MapsPrimTable;
