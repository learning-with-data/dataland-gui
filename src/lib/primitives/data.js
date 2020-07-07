import {
  BLOCKARG_DATA_COLUMN,
  BLOCKARG_DATA_COMPARISON_OPERATOR,
  BLOCKARG_DATA_MATCH,
} from "../blockly/constants";

import {
  PROJECT_DATA_UPDATED,
  PROJECT_DATA_NEXT_ROW_SELECTED,
  PROJECT_DATA_ROW_SELECTION_RESET,
} from "../../redux/actionsTypes";

class DataPrimTable {
  constructor(store) {
    this.store = store;
    this.dataStack = [];

    this.data_row_count = () => this.primDataRowCount();

    this.data_select_next = () =>
      this.store.dispatch({ type: PROJECT_DATA_NEXT_ROW_SELECTED });

    this.data_get = (b) => this.primDataGet(b);

    this.data_filter = (b) => this.primDataFilter(b);

    this._data_restore = () => this._primDataRestore();
  }

  primDataRowCount() {
    const state = this.store.getState();

    return state.projectDataState.data.length;
  }

  primDataGet(block) {
    const state = this.store.getState();

    const idx = state.projectDataState.selectRow.selected[0] - 1;
    if (idx >= state.projectDataState.data.length) {
      // Returns nothing if selectedRow goes beyond the last one
      // TODO: Revisit the decision (do we allow "wrapping"?)
      return "";
    }
    const selectedRow = state.projectDataState.data[idx];

    const columnName = block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN);
    return selectedRow[columnName];
  }

  primDataFilter(block) {
    const columnName = block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN);
    const operator = block.thread.getBlockArg(
      block,
      BLOCKARG_DATA_COMPARISON_OPERATOR
    );
    const match = block.thread.getBlockArg(block, BLOCKARG_DATA_MATCH);

    const state = this.store.getState();
    console.log(operator, match);
    const newData = state.projectDataState.data.filter((row) => {
      switch (operator) {
        case "eq":
          // TODO: This and "ne" will need to be more clever as 'match' will be a string
          return row[columnName] == match;
        case "neq":
          return row[columnName] !== match;
        case "gt":
          return row[columnName] > Number(match);
        case "lt":
          return row[columnName] < Number(match);
        case "gte":
          return row[columnName] >= Number(match);
        case "lte":
          return row[columnName] <= Number(match);
        default:
          console.warn(
            `Error: got unknown operator ${operator} for ${block.type}`
          );
      }
    });
    this.dataStack.push(state.projectDataState.data);
    this.store.dispatch({ type: PROJECT_DATA_UPDATED, payload: newData });
    this.store.dispatch({ type: PROJECT_DATA_ROW_SELECTION_RESET });

    block.thread.stack.push(block.thread.currentStack);
    block.thread.currentStack = undefined;

    // Insert a "fake block" that will cause the previous data to be restored when the c-block ends
    block.thread.stack.push({ block: { type: "_data_restore" } });

    // Insert the content of the c-block
    block.thread.stack.push(block.statement);
  }

  _primDataRestore() {
    const data = this.dataStack.pop();
    this.store.dispatch({ type: PROJECT_DATA_UPDATED, payload: data });
    this.store.dispatch({ type: PROJECT_DATA_ROW_SELECTION_RESET });
  }
}

export default DataPrimTable;
