import React from "react";

import PropTypes from "prop-types";

import { Column, Table } from "react-virtualized";
import AutoSizer from "react-virtualized-auto-sizer";

import "react-virtualized/styles.css";

const TableView = React.memo((props) => {
  if (props.data && props.data.length > 0) {
    const table = (
      <AutoSizer defaultWidth={480} defaultHeight={360}>
        {({ height, width }) => (
          <Table
            className="data-table"
            headerClassName="data-table-header"
            headerHeight={30}
            height={height}
            rowCount={props.data.length}
            rowGetter={({ index }) => props.data[index]}
            rowHeight={40}
            rowStyle={({ index }) => {
              return {
                background: props.data[index]?.__selected ? "gray" : index%2 ? "white" : "#f2f2f2",
                color: props.data[index]?.__selected ? "white" : "black",
              };
            }}
            scrollToIndex={props.data.findIndex((row) => row.__selected)}
            width={width}
          >
            <Column
              className="data-table-cell"
              label={"Row #"}
              dataKey={"__visible_id"}
              key={-1}
              width={50}
            />
            {props.columns.map((column, i) => {
              return (
                <Column
                  className="data-table-cell"
                  label={column}
                  dataKey={column}
                  key={i}
                  width={(width - 50)/ (props.columns.length)}
                />
              );
            })}
          </Table>
        )}
      </AutoSizer>
    );

    return table;
  } else {
    return (
      <div className="p-4 data-placeholder w-100 h-100 justify-content-between align-items-center">
        <span className="muted">
          No data loaded. You can import data by using the &ldquo;Import
          data&rdquo; button above.
        </span>
      </div>
    );
  }
});

TableView.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
};

TableView.displayName = "TableView";

export default TableView;
