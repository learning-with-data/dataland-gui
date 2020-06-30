import cloneDeep from "lodash/cloneDeep";

import {
  PROJECT_DATA_IMPORTED,
  PROJECT_DATA_UPDATED,
  PROJECT_DATA_NEXT_ROW_SELECTED,
  PROJECT_DATA_ROW_SELECTION_RESET,
} from "../actionsTypes";

const initialState = {
  originalData: {}, // Set only with PROJECT_DATA_IMPORTED. Used for saving the project
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

function projectDataReducer(state = initialState, action) {
  switch (action.type) {
    case PROJECT_DATA_IMPORTED:
      var originalData = cloneDeep(action.payload);
      // Add a row # column
      action.payload.meta.fields.unshift("Row #");
      var data = action.payload.data.map((x, i) =>
        Object.assign(x, { "Row #": i + 1 })
      );
      // Generate a column list
      var columns = action.payload.meta.fields.map((x) => {
        return {
          dataField: x,
          text: x,
          classes: "data-table-column",
          title: true,
          formatter: (cell) => {
            if (typeof cell === "object") {
              return cell.toString();
            } else {
              return cell;
            }
          },
        };
      });
      return Object.assign({}, state, {
        originalData: originalData,
        originalDataTimestamp: Date.now(),
        data: data,
        columns: columns,
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
