import React from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";

import "./style.css";

function SaveStatusComponent(props) {
  if (props.savedTimeStamp === null && props.needsSave === false) {
    return <div className="savestatus-container text-center"> </div>;
  }

  dayjs.extend(LocalizedFormat);

  const popover = (
    <Popover id="popover-basic">
      <Popover.Title as="h3">Project save status</Popover.Title>
      <Popover.Content>
        {props.needsSave
          ? "There are unsaved changes."
          : "All changes have been saved."}
        <br />
        <span className="small text-muted">
          Last saved: {props.savedTimeStamp === null && "Never"}
          {props.savedTimeStamp !== null &&
            dayjs(props.savedTimeStamp).format("LTS")}
        </span>
      </Popover.Content>
    </Popover>
  );

  return (
    <div className="savestatus-container text-center">
      <OverlayTrigger
        trigger={["hover", "focus"]}
        placement="bottom"
        overlay={popover}
      >
        <svg
          viewBox="0 0 16 16"
          id="save-indicator-circle"
          fill={props.needsSave ? "darkorange" : "darkseagreen"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="8" />
        </svg>
      </OverlayTrigger>
    </div>
  );
}

SaveStatusComponent.propTypes = {
  needsSave: PropTypes.bool,
  savedTimeStamp: PropTypes.number,
};

const mapStateToProps = function (store) {
  return {
    needsSave:
      store.guiState.projectModifiedTimeStamp >
      store.guiState.projectSavedTimeStamp,
    savedTimeStamp: store.guiState.projectSavedTimeStamp,
  };
};

export default connect(mapStateToProps)(SaveStatusComponent);
