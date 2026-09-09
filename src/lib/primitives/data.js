import {
  BLOCKARG_DATA_AGGREGATION_FUNCTION,
  BLOCKARG_DATA_BOOLEAN,
  BLOCKARG_DATA_COLUMN,
  BLOCKARG_DATA_COMPARISON_OPERATOR,
  BLOCKARG_DATA_MATCH,
  BLOCKARG_DATA_ROWNUM,
  BLOCKARG_DATA_SETVALUE,
} from "../blockly/constants";

class DataPrimTable {
  constructor(runtime) {
    this.runtime = runtime;

    this.data_row_count = () => this.primDataRowCount();

    this.data_select_next = () => this.primDataSelectNextRow();
    this.data_select = (b) => this.primDataSelect(b);

    this.data_get = (b) => this.primDataGet(b);
    this.data_set = (b) => this.primDataSet(b);

    this.data_filter = (b) => this.primDataFilter(b);
    this.data_aggregate = (b) => this.primDataAggregate(b);

    // Value blocks. The interpreter's real-value path (Thread.getBlockArg ->
    // evalBlock) needs a primitive for each block type used as a value, but
    // text/math_number are not core language primitives — they are utility
    // blocks for supplying a value to an input. Without these, a real
    // <block type="math_number"> inside a value input evaluates to
    // undefined (the toolbox shadow path reads the field directly, which is
    // why hand-dragged blocks worked but AI-generated blocks with real
    // child blocks did not).
    this.math_number = (b) => this.primMathNumber(b);
    this.text = (b) => this.primText(b);

    this._data_restore = () => this._primDataRestore();
  }

  primDataRowCount() {
    return this.runtime.getDataTable().getCurrentRowCount();
  }

  primDataSelectNextRow() {
    this.runtime.getDataTable().selectNextRow();
    this.runtime.dispatchDataUpdate();
  }

  primDataSelect(block) {
    const rowNum = block.thread.getBlockArg(block, BLOCKARG_DATA_ROWNUM);
    this.runtime.getDataTable().selectRow(rowNum - 1);
    this.runtime.dispatchDataUpdate();
  }

  primDataGet(block) {
    const columnName = block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN);
    return this.runtime.getDataTable().getCellValue(columnName);
  }

  primDataSet(block) {
    const columnName = block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN);
    const value = block.thread.getBlockArg(block, BLOCKARG_DATA_SETVALUE);

    this.runtime.getDataTable().setCellValue(columnName, value);
    this.runtime.dispatchDataUpdate();
  }

  primDataFilter(block) {
    const totalConditions =
      block.mutation.hasAdditionalCondition == "true" ? 2 : 1;

    var filter = [];

    for (let i = 0; i < totalConditions; i++) {
      let col = block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN + i);
      let op = block.thread.getBlockArg(
        block,
        BLOCKARG_DATA_COMPARISON_OPERATOR + i
      );
      let testval = block.thread.getBlockArg(block, BLOCKARG_DATA_MATCH + i);
      filter.push([col, op, testval]);
      if (totalConditions > 1 && i < totalConditions - 1) {
        let boolean_op = block.thread.getBlockArg(
          block,
          BLOCKARG_DATA_BOOLEAN + i
        );
        filter.push([boolean_op]);
      }
    }
    this.runtime.getDataTable().pushFilter(filter);
    this.runtime.dispatchDataUpdate();

    block.thread.stack.push(block.thread.currentStack);
    block.thread.currentStack = undefined;

    // Insert a "fake block" that will cause the previous data to be restored when the c-block ends
    block.thread.stack.push({ block: { type: "_data_restore" } });

    // Insert the content of the c-block
    block.thread.stack.push(block.statement);
  }

  primDataAggregate(block) {
    const groupingVariable = block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN + 0);
    const operation = block.thread.getBlockArg(block, BLOCKARG_DATA_AGGREGATION_FUNCTION);
    const targetVariable = block.thread.getBlockArg(block, BLOCKARG_DATA_COLUMN + 1);

    this.runtime.getDataTable().aggregate(groupingVariable, operation, targetVariable);
    this.runtime.dispatchDataUpdate();

    // Insert a "fake block" that will cause the previous data to be restored when the c-block ends
    block.thread.stack.push({ block: { type: "_data_restore" } });

    // Insert the content of the c-block
    block.thread.stack.push(block.statement);
  }

  // math_number uses a field_input (not field_number) so the user can type
  // any value, including non-numeric text. When the content is numeric, emit a
  // real number (what a number block ought to produce); otherwise pass the raw
  // string through so text values like "cat" still work. Type-aware comparison
  // at runtime (see DataTable.pushFilter) handles the rest.
  primMathNumber(block) {
    const value = block.thread.getBlockArg(block, "NUM");
    if (value === undefined || value === null) return value;
    const trimmed = String(value).trim();
    if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
      return Number(trimmed);
    }
    return value;
  }

  primText(block) {
    return block.thread.getBlockArg(block, "TEXT");
  }

  _primDataRestore() {
    this.runtime.getDataTable().popFilter();
    this.runtime.dispatchDataUpdate();
  }
}

export default DataPrimTable;
