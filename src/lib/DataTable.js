"use strict";

import { List } from "immutable";

class DataTable {
  constructor(data) {
    this._selection = 0;
    this._dataList = List();
    this._dataList = this._dataList.push(
      (this._data = List(
        data.map((row, i) => {
          return {
            // Fields starting with __ represent metadata
            // Everything else are columns
            __id: Math.random().toString(36).slice(2),
            __visible_id: i + 1,
            __selected: i === this._selection,
            ...row,
          };
        })
      ))
    );
  }

  selectRow(selection) {
    if (selection < 0 || selection >= this._dataList.last().size) {
      return;
    }
    this._selection = selection;
    this._dataList = this._dataList.set(
      -1,
      this._dataList.last().map((row, i) => {
        return { ...row, __selected: i === this._selection };
      })
    );
  }

  selectNextRow() {
    this.selectRow(this._selection + 1);
  }

  getSelectedRow() {
    return this._dataList.last().find((row) => {
      return row.__selected;
    });
  }

  getCellValue(colName) {
    const selectedRow = this._dataList.last().find((row) => {
      return row.__selected;
    });

    return selectedRow[colName];
  }

  setCellValue(colName, value) {
    const selectedRow = this._dataList.last().find((row) => {
      return row.__selected;
    });
    const id = selectedRow.__id;
    this._dataList = this._dataList.map((data) => {
      return data.map((row) => {
        if (id === row.__id) return { ...row, [colName]: value };
        return row;
      });
    });
  }

  addColumn(colName) {
    if (this.getCurrentColumns().indexOf(colName) > -1) {
      console.warn("Attempt to add column that already exists");
      return;
    }

    this._dataList = this._dataList.map((data) => {
      return data.map((row) => {
        return { ...row, [colName]: "" };
      });
    });
  }

  getCurrentColumns() {
    try {
      return Object.keys(this._dataList.last().first()).filter(
        (c) => !c.startsWith("__")
      );
    } catch (e) {
      console.warn(e);
      return [];
    }
  }

  getCurrentData() {
    return this._dataList.last().toArray();
  }

  getCurrentRowCount() {
    return this._dataList.last().size;
  }

  popFilter() {
    if (this._dataList.size > 1) this._dataList = this._dataList.pop();
  }

  pushFilter(filter) {
    const data = this._dataList.last();
    const filteredData = data.filter((row) => {
      var expression = [];
      var stack = [];

      // First, turn this into a simplified postfix expression
      filter.forEach((condition) => {
        if (condition.length > 1) {
          var colName = condition[0];
          var comparison_operator = condition[1];
          var testValue = condition[2];
          switch (comparison_operator) {
            case "eq":
              // TODO: This and "ne" will need to be more clever as 'match' will be a string
              expression.push(row[colName] == testValue);
              break;
            case "neq":
              expression.push(row[colName] !== testValue);
              break;
            case "gt":
              expression.push(row[colName] > Number(testValue));
              break;
            case "lt":
              expression.push(row[colName] < Number(testValue));
              break;
            case "gte":
              expression.push(row[colName] >= Number(testValue));
              break;
            case "lte":
              expression.push(row[colName] <= Number(testValue));
              break;
            default:
              console.warn(
                `Error: got unknown comparison operator ${comparison_operator} while filtering rows`
              );
          }
        } else {
          while (stack.length > 0) expression.push(stack.pop());
          stack.push(condition[0]);
        }
      });
      while (stack.length > 0) expression.push(stack.pop());

      // Next, evaluate the simpler expression
      stack = [];
      expression.forEach((token) => {
        if (typeof token === "boolean") {
          stack.push(token);
        } else {
          var a = stack.pop();
          var b = stack.pop();
          switch (token) {
            case "and":
              stack.push(a && b);
              break;
            case "or":
              stack.push(a || b);
              break;
            default:
              console.warn(
                `Error: got unknown boolean operator ${token} while filtering rows`
              );
          }
        }
      });

      if (stack.length !== 1) {
        console.warn(`Error: failed to parse filter ${filter} correctly`);
      }

      return stack[0];
    });

    this._dataList = this._dataList.push(
      filteredData.map((row, i) => {
        return {
          ...row,
          __visible_id: i + 1,
          __selected: i === 0,
        };
      })
    );
  }
}

export default DataTable;
