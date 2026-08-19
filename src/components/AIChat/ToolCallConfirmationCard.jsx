import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Card, Button } from "react-bootstrap";
import {
  BlockPreviewRenderer,
  isBlocksJson,
} from "../../services/ai/BlockPreviewRenderer";

/**
 * A confirmation card shown while the AI agent is waiting for the user's
 * approval of a project-mutating action (add a column, create a variable,
 * insert code). Shows a human-readable summary of the requested change, and
 * — for code insertion — a live block preview, plus Allow/Deny buttons.
 */
const ToolCallConfirmationCard = ({
  event,
  projectDataColumns,
  onDecision,
}) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewInvalid, setPreviewInvalid] = useState(false);

  // For insertCode, render the proposed blocks as a preview so the user can
  // see exactly what would be loaded.
  useEffect(() => {
    setPreviewUrl("");
    setPreviewInvalid(false);
    if (event.name !== "insertCode") return undefined;

    const args = event.args || {};
    const result = isBlocksJson(
      typeof args.code === "string" ? args.code : JSON.stringify(args.code)
    );
    if (result.status !== "ok") {
      setPreviewInvalid(true);
      return undefined;
    }
    let cancelled = false;
    const columns = JSON.stringify(projectDataColumns || []);
    BlockPreviewRenderer.renderPreview(result.json, columns).then((url) => {
      if (!cancelled && url) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [event, projectDataColumns]);

  return (
    <Card
      className="border-warning small mb-2"
      style={{ maxWidth: "80%" }}
      data-testid="tool-confirmation-card"
    >
      <Card.Body className="py-2 px-2">
        <div className="d-flex flex-column">
          <div>
            <span className="fw-bold me-1">🛡️ AI agent wants to:</span>{" "}
            <span>{event.description || "perform an action"}</span>
          </div>
          {event.name === "insertCode" &&
            (previewUrl ? (
              <img
                src={previewUrl}
                alt="Proposed blocks preview"
                className="rounded border mt-2"
                style={{ maxWidth: "100%", display: "block" }}
              />
            ) : previewInvalid ? (
              <div className="text-danger mt-2">
                The proposed code could not be previewed.
              </div>
            ) : (
              <div className="text-muted mt-2">Rendering preview…</div>
            ))}
          <div className="d-flex align-items-center mt-2 gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => onDecision(true)}
              data-testid="tool-confirm-allow"
            >
              Allow
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => onDecision(false)}
              data-testid="tool-confirm-deny"
            >
              Deny
            </Button>
            <span className="text-muted" style={{ fontSize: "0.75rem" }}>
              Waiting for your decision…
            </span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

ToolCallConfirmationCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    args: PropTypes.object,
    status: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  projectDataColumns: PropTypes.array,
  onDecision: PropTypes.func.isRequired,
};

export default ToolCallConfirmationCard;
