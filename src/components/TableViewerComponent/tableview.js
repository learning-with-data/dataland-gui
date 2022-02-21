import React, { useEffect, useRef } from "react";

import PropTypes from "prop-types";

import BaseTable, { AutoResizer, Column } from "react-base-table";
import "react-base-table/styles.css";

import { OverlayTrigger, Tooltip } from "react-bootstrap";

const TableCell = (props) => {
  // FIXME: Is there a better way to get the table node?
  const tableNode = props.container.tableNode;
  return (
    <OverlayTrigger
      placement="auto"
      container={tableNode}
      overlay={
        <Tooltip id={`tooltip-cell-${props.rowIndex}-${props.cellData}`}>
          {props.cellData}
        </Tooltip>
      }
    >
      <span className={props.className}>{props.cellData}</span>
    </OverlayTrigger>
  );
};
TableCell.propTypes = {
  className: PropTypes.string,
  cellData: PropTypes.any,
  container: PropTypes.object,
  rowIndex: PropTypes.number,
};

const TableHeaderCell = (props) => {
  // FIXME: Is there a better way to get the table node?
  const tableNode = props.container.tableNode;
  return (
    <OverlayTrigger
      placement="auto"
      container={tableNode}
      overlay={
        <Tooltip id={`tooltip-cell-${props.column.title}`}>
          {props.column.title}
        </Tooltip>
      }
    >
      <span className={props.className}>{props.column.title}</span>
    </OverlayTrigger>
  );
};
TableHeaderCell.propTypes = {
  className: PropTypes.string,
  column: PropTypes.object,
  container: PropTypes.object,
};

const TableView = React.memo((props) => {
  const tableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollToRow(
        props.data.findIndex((row) => row.__selected)
      );
    }
  });

  return (
    <AutoResizer>
      {({ width, height }) => (
        <BaseTable
          width={width}
          height={height}
          data={props.data}
          className="data-table"
          headerClassName="data-table-header"
          rowKey="__id"
          ref={tableRef}
          components={{ TableCell, TableHeaderCell }}
          rowClassName={({ rowData, rowIndex }) => {
            return rowData.__selected
              ? "row-selected"
              : "row-unselected" +
                  " " +
                  (rowIndex % 2 ? "row-light" : "row-dark");
          }}
          emptyRenderer={
            <div className="p-4 data-placeholder w-100 h-100 justify-content-between align-items-center">
              <span className="muted">
                No data loaded. You can import data by using the &ldquo;Import
                data&rdquo; button above.
              </span>
            </div>
          }
        >
          <Column
            className="data-table-cell"
            title={"Row #"}
            dataKey={"__visible_id"}
            key={-1}
            width={75}
          />
          {props.columns.map((column, i) => {
            return (
              <Column
                className="data-table-cell"
                title={column}
                dataKey={column}
                key={i}
                width={(width - 75) / props.columns.length}
              />
            );
          })}
        </BaseTable>
      )}
    </AutoResizer>
  );
});

TableView.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
};

TableView.displayName = "TableView";

export default TableView;
