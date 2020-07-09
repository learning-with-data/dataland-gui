import {
  BLOCKARG_DATA_BOOLEAN,
  BLOCKARG_DATA_COLUMN,
  BLOCKARG_DATA_COMPARISON_OPERATOR,
  BLOCKARG_DATA_MATCH,
  BLOCKARG_DATA_ROWNUM,
  BLOCKARG_DATA_SETVALUE,
} from "../blockly/constants";

import {
  PROJECT_DATA_UPDATED,
  PROJECT_DATA_NEXT_ROW_SELECTED,
  PROJECT_DATA_NEW_ROW_SELECTED,
  PROJECT_DATA_ROW_SELECTION_RESET,
  PROJECT_DATA_ROW_UPDATED,
} from "../../redux/actionsTypes";

class DataPrimTable {
  constructor(store) {
    this.store = store;
    this.dataStack = [];

    this.data_row_count = () => this.primDataRowCount();

    this.data_select_next = () =>
      this.store.dispatch({ type: PROJECT_DATA_NEXT_ROW_SELECTED });
    this.data_select = (b) =>
      this.store.dispatch({
        type: PROJECT_DATA_NEW_ROW_SELECTED,
        payload: Number(b.thread.getBlockArg(b, BLOCKARG_DATA_ROWNUM)),
      });

    this.data_get = (b) => this.primDataGet(b);
    this.data_set = (b) => this.primDataSet(b);

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

  primDataSet(block) {
    const state = this.store.getState();

    const idx = state.projectDataState.selectRow.selected[0] - 1;
    if (idx >= state.projectDataState.data.length) {
      // Does nothing if selectedRow goes beyond the last one
      // TODO: Revisit the decision (do we allow "wrapping"?)
      return;
    }
    const selectedRow = state.projectDataState.data[idx];

    const columnName = block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN);
    const setValue = block.thread.getBlockArg(block, BLOCKARG_DATA_SETVALUE);

    const updatedRow = { ...selectedRow, [columnName]: setValue };

    this.store.dispatch({
      type: PROJECT_DATA_ROW_UPDATED,
      payload: { idx, updatedRow },
    });
    // selectedRow[columnName];
  }

  primDataFilter(block) {
    const totalConditions =
      block.mutation.hasAdditionalCondition == "true" ? 2 : 1;

    var columnNames = [];
    var operators = [];
    var matches = [];

    for (let i = 0; i < totalConditions; i++) {
      columnNames.push(
        block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN + i)
      );
      operators.push(
        block.thread.getBlockArg(block, BLOCKARG_DATA_COMPARISON_OPERATOR + i)
      );
      matches.push(block.thread.getBlockArg(block, BLOCKARG_DATA_MATCH + i));
    }

    const state = this.store.getState();

    const newData = state.projectDataState.data.filter((row) => {
      let finalCondition;

      for (let i = 0; i < totalConditions; i++) {
        let columnName = columnNames[i];
        let operator = operators[i];
        let match = matches[i];
        let condition = false;
        switch (operator) {
          case "eq":
            // TODO: This and "ne" will need to be more clever as 'match' will be a string
            condition = row[columnName] == match;
            break;
          case "neq":
            condition = row[columnName] !== match;
            break;
          case "gt":
            condition = row[columnName] > Number(match);
            break;
          case "lt":
            condition = row[columnName] < Number(match);
            break;
          case "gte":
            condition = row[columnName] >= Number(match);
            break;
          case "lte":
            condition = row[columnName] <= Number(match);
            break;
          default:
            console.warn(
              `Error: got unknown operator ${operator} while filtering rows`
            );
        }

        if (totalConditions == 1) {
          return condition;
        } else if (finalCondition === undefined) {
          finalCondition = condition;
        } else {
          const boolean_op = block.thread.getBlockArg(
            block,
            BLOCKARG_DATA_BOOLEAN + (i - 1)
          );
          if (boolean_op === "and") {
            finalCondition = finalCondition && condition;
          } else {
            finalCondition = finalCondition || condition;
          }
        }
      }

      return finalCondition;
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
