import EventEmitter from "events";

import { Interpreter } from "dataland-interpreter";
import { parseString } from "xml2js";

import DataTable from "./DataTable";
import PrimTable from "./primitives";

const _blankVisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v4.json",
  width: "container",
  height: "container",
  layer: [],
};

class Runtime extends EventEmitter {
  constructor() {
    super();

    this._interpreter = null;

    this._data = null;
    this._visualizationSpec = _blankVisualizationSpec;
  }

  setDataTable(data) {
    this._data = new DataTable(data);
    this.dispatchDataUpdate();
  }

  getDataTable() {
    return this._data;
  }

  addColumn(col) {
    this._data.addColumn(col);
    this.dispatchDataUpdate();
  }

  setVisualizationSpec(spec) {
    this._visualizationSpec = spec;
    this.dispatchVisualizationUpdate();
  }

  getVisualizationSpec() {
    return this._visualizationSpec;
  }

  getCurrentData() {
    if (this._data) {
      return this._data.getCurrentData();
    } else {
      return [];
    }
  }

  getCurrentColumns() {
    if (this._data) {
      return this._data.getCurrentColumns();
    } else {
      return [];
    }
  }

  dispatchVisualizationUpdate(cleared = false) {
    if (cleared) this._visualizationSpec = _blankVisualizationSpec;
    this.emit("visualization-updated", this._visualizationSpec);
  }

  dispatchDataUpdate() {
    this.emit("data-updated", this._data.getCurrentData());
  }

  async parseCode(code) {
    return new Promise((resolve, reject) => {
      parseString(
        code,
        { explicitArray: false, mergeAttrs: true },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  async startInterpreter(code, triggerEvent, onDone) {
    const parsedCode = await this.parseCode(code);
    this._interpreter = new Interpreter(
      parsedCode.xml,
      PrimTable(this),
      onDone
    );
    this._interpreter.start(triggerEvent);
    return this._interpreter;
  }

  stopInterpreter() {
    this._interpreter.stop();
  }
}

export default Runtime;
