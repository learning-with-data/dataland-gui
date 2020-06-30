import ControlPrimTable from "./control";
import OperatorPrimTable from "./operator";
import DataPrimTable from "./data";
import DebugPrimTable from "./debug";

export default function(store) {
  return Object.assign(new ControlPrimTable(), new OperatorPrimTable(), new DataPrimTable(store), new DebugPrimTable());
}
