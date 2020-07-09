import cloneDeep from "lodash/cloneDeep";

import {
  PROJECT_DATA_COLUMN_ADDED,
  PROJECT_DATA_IMPORTED,
  PROJECT_DATA_NEXT_ROW_SELECTED,
  PROJECT_DATA_ROW_SELECTION_RESET,
  PROJECT_DATA_ROW_UPDATED,
  PROJECT_DATA_UPDATED,
} from "../actionsTypes";

const initialState = {
  // originalData is the copy of the data that gets saved with
  // the project. It is updated only with non-code, GUI actions.
  originalData: {},
  originalDataTimestamp: 0,
  data: [],
  columns: [],
  keyField: "",
  selectRow: {
    mode: "radio",
    clickToSelect: false,
    bgColor: "#FF8C1A",
    hideSelectColumn: true,
    selected: [1],
  },
};

function ingestData(data) {
  // Add a row # column
  data.meta.fields.unshift("Row #");
  var newData = data.data.map((x, i) => Object.assign(x, { "Row #": i + 1 }));
  // Generate a column list
  var columns = data.meta.fields.map((x) => {
    return {
      dataField: x,
      text: x,
      classes: "data-table-column",
      title: true,
      formatter: (cell) => {
        if (cell === null) {
          return "";
        } else if (typeof cell === "object") {
          return cell.toString();
        } else {
          return cell;
        }
      },
    };
  });

  return { data: newData, columns: columns };
}

function projectDataReducer(state = initialState, action) {
  switch (action.type) {
    case PROJECT_DATA_IMPORTED:
      var originalData = cloneDeep(action.payload);
      var ingestedData = ingestData(action.payload);
      return Object.assign({}, state, {
        originalData: originalData,
        originalDataTimestamp: Date.now(),
        data: ingestedData.data,
        columns: ingestedData.columns,
        keyField: "Row #",
      });
    case PROJECT_DATA_COLUMN_ADDED:
      var columnName = action.payload;
      var newData = cloneDeep(state.originalData);
      newData.meta.fields.push(columnName);
      newData.data = newData.data.map((x) => {
        return Object.assign(x, { columnName: "" });
      });
      var newOriginalData = cloneDeep(newData);
      var newIngestedData = ingestData(newData);
      return Object.assign({}, state, {
        originalData: newOriginalData,
        originalDataTimestamp: Date.now(),
        data: newIngestedData.data,
        columns: newIngestedData.columns,
        keyField: "Row #",
      });
    case PROJECT_DATA_UPDATED:
      // Regenerate row #
      var updateData = action.payload.map((x, i) =>
        Object.assign(x, { "Row #": i + 1 })
      );
      return {
        ...state,
        data: updateData,
      };
    case PROJECT_DATA_ROW_UPDATED:
      var dataWithNewRow = state.data.map((x, i) => {
        if (i === action.payload.idx) {
          return action.payload.updatedRow;
        } else {
          return x;
        }
      });
      return {
        ...state,
        data: dataWithNewRow
      };
    case PROJECT_DATA_NEXT_ROW_SELECTED:
      return {
        ...state,
        selectRow: {
          ...state.selectRow,
          selected: [state.selectRow.selected[0] + 1],
        },
      };
    case PROJECT_DATA_ROW_SELECTION_RESET:
      return {
        ...state,
        selectRow: {
          ...state.selectRow,
          selected: [1],
        },
      };
    default:
      return state;
  }
}

export default projectDataReducer;
