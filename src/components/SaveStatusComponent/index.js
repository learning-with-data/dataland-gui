import React from "react";

import { connect } from "react-redux";
import PropTypes from "prop-types";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

import Moment from "react-moment";

import "./style.css";

function SaveStatusComponent(props) {
  const needsSave =
    props.lastSaveTimestamp < props.codeUpdateTimestamp ||
    props.lastSaveTimestamp < props.originalDataTimestamp;

  const popover = (
    <Popover id="popover-basic">
      <Popover.Title as="h3">Project save status</Popover.Title>
      <Popover.Content>
        {needsSave
          ? "There are unsaved changes."
          : "All changes have been saved."}
        <br />
        <span className="small text-muted">
          Last saved: <Moment format="LTS" interval={0}>{props.lastSaveTimestamp}</Moment>
        </span>
      </Popover.Content>
    </Popover>
  );

  return (
    <div style={{ width: "3em" }} className="savestatus-container text-center">
      <OverlayTrigger
        trigger={["hover", "focus"]}
        placement="bottom"
        overlay={popover}
      >
        <svg
          viewBox="0 0 16 16"
          id="save-indicator-circle"
          fill={needsSave ? "darkorange" : "darkseagreen" }
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="8" />
        </svg>
      </OverlayTrigger>
    </div>
  );
}

SaveStatusComponent.propTypes = {
  lastSaveTimestamp: PropTypes.number,
  lastSaveRequestTimeStamp: PropTypes.number,

  codeUpdateTimestamp: PropTypes.number,
  originalDataTimestamp: PropTypes.number,
};

const mapStateToProps = function (store) {
  return {
    codeUpdateTimestamp: store.projectCodeState.codeUpdateTimestamp,
    originalDataTimestamp: store.projectDataState.originalDataTimestamp,
  };
};

export default connect(mapStateToProps)(SaveStatusComponent);
