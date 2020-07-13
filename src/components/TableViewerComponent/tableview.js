import React from "react";

import PropTypes from "prop-types";
import Table from "react-bootstrap/Table";

const TableView = React.memo((props) => {
  if (props.data && props.data.length > 0) {
    return (
      <Table size="sm" striped className="data-table">
        <thead>
          <tr>
            <th>Row #</th>
            {props.columns.map((column, i) => {
              return <th data-column={column} key={i}>{column}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {props.data.map((row, i) => {
            return (
              <tr key={i} data-id={row.__id} className={row.__selected ? "selected-row" : null}>
                <td className="data-table-column" key={-1}>{row.__visible_id}</td>
                {props.columns.map((column, i) => {
                  return <td data-column={column} className="data-table-column" key={i}>{row[column]}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
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
