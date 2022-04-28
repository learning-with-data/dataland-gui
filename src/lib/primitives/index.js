import ControlPrimTable from "./control";
import DataPrimTable from "./data";
import MapsPrimTable from "./maps";
import OperatorPrimTable from "./operator";
import VisualizationPrimTable from "./visualization";
import VariablesPrimTable from "./variables";

import DebugPrimTable from "./debug";

export default function (runtime) {
  return Object.assign(
    new ControlPrimTable(),
    new DataPrimTable(runtime),
    new MapsPrimTable(runtime),
    new OperatorPrimTable(),
    new VisualizationPrimTable(runtime),
    new VariablesPrimTable(runtime),
    new DebugPrimTable()
  );
}
