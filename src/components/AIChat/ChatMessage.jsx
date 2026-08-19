import React, { useState } from "react";
import PropTypes from "prop-types";
import { Card, Button, Collapse } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import summarizeToolCall from "./summarizeToolCall";
import { isBlocksJson } from "../../services/ai/BlockPreviewRenderer";

/**
 * A compact, read-only summary of a completed tool call, shown in the
 * transcript of an assistant message. Mutating tools also show the
 * user's decision (allowed or declined) and any error.
 */
const ToolEventChip = ({ event }) => {
  let outcome = null;
  if (event.status === "done") {
    if (event.confirmed === false) {
      outcome = <span className="text-danger">✗ declined by user</span>;
    } else if (event.error) {
      outcome = <span className="text-danger">✗ {event.error}</span>;
    } else {
      outcome = <span className="text-success">✓ done</span>;
    }
  } else if (event.status === "started" || event.status === "pending_confirmation") {
    outcome = <span className="text-warning">…</span>;
  }
  return (
    <Card className="border-info small mb-1">
      <Card.Body className="py-1 px-2">
        <span className="fw-bold me-1">🔧 {event.name}</span>
        <span className="text-muted me-1">
          {event.description || summarizeToolCall(event.name, event.args)}
        </span>
        {outcome}
      </Card.Body>
    </Card>
  );
};

ToolEventChip.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    args: PropTypes.object,
    status: PropTypes.string.isRequired,
    description: PropTypes.string,
    result: PropTypes.string,
    error: PropTypes.string,
    confirmed: PropTypes.bool,
  }).isRequired,
};

const ChatMessage = ({ message }) => {
  const isAssistant = message.role === "assistant";
  // A message with no content, no reasoning, and no tool events is a
  // rendering artifact (e.g. a model turn that produced nothing). Rather
  // than showing an empty bubble, it is not rendered at all.
  const hasRenderableContent =
    (typeof message.content === "string" &&
      message.content.trim().length > 0) ||
    Boolean(message.reasoning) ||
    Boolean(message.tool_events && message.tool_events.length > 0);
  // Reasoning in a completed history message is already finished, so it
  // starts collapsed; the user can expand it via the toggle to inspect.
  // (While the AI is streaming, the reasoning is shown live and expanded in
  // ChatPanel's typing view, not in ChatMessage.)
  const [showReasoning, setShowReasoning] = useState(false);

  // For assistant messages, the content may contain a Blockly blocks payload
  // (usually inside a Markdown JSON fence). The blocks themselves are only
  // shown in the Allow/Deny confirmation card (see ChatPanel); here the
  // bubble shows the preamble prose above the payload so the user keeps the
  // context for the decision.
  const blocksResult = isAssistant
    ? isBlocksJson(message.content || "")
    : null;
  const blocksProse =
    blocksResult && blocksResult.status === "ok"
      ? blocksResult.prose || ""
      : "";

  if (!hasRenderableContent) {
    return null;
  }

  return (
    <div
      className={`d-flex mb-3 ${
        isAssistant ? "justify-content-start" : "justify-content-end"
      }`}
    >
      <Card
        className={`p-2 ${
          isAssistant ? "bg-light text-dark" : "bg-primary text-white"
        }`}
        style={{ maxWidth: "80%" }}
      >
        <div className="fw-bold small mb-1">
          {isAssistant ? "AI Assistant" : "You"}
        </div>
        {message.tool_events && (
          <div className="mb-2">
            {message.tool_events.map((event) => (
              <ToolEventChip key={event.id} event={event} />
            ))}
          </div>
        )}
        <div>
          {message.reasoning && (
            <div
              className="mb-2 small"
              style={{
                borderLeft: "2px solid #ccc",
                paddingLeft: "8px",
              }}
            >
              <Button
                variant="link"
                size="sm"
                className="p-0 text-decoration-none d-inline-flex align-items-center"
                onClick={() => setShowReasoning((v) => !v)}
                aria-expanded={showReasoning}
              >
                <span className="me-1">{showReasoning ? "▾" : "▸"}</span>
                Reasoning
              </Button>
              <Collapse in={showReasoning}>
                <div
                  className="small italic text-muted"
                  style={{ fontStyle: "italic", marginTop: "4px" }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.reasoning}</ReactMarkdown>
                </div>
              </Collapse>
            </div>
          )}
          {blocksResult && blocksResult.status === "ok" ? (
            <div className="mt-2">
              {blocksProse ? (
                <div
                  className="ai-chat-content" style={{ wordBreak: "break-word" }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{blocksProse}</ReactMarkdown>
                </div>
              ) : (
                <div
                  className="d-inline-flex align-items-center small text-info-emphasis"
                  style={{
                    background: "#e7f1ff",
                    borderLeft: "3px solid #0d6efd",
                    borderRadius: "6px",
                    padding: "4px 10px",
                  }}
                >
                  <span className="me-1">🧩</span>
                  Blocks are ready — approve them in the card below.
                </div>
              )}
            </div>
          ) : blocksResult && blocksResult.status === "invalid" ? (
            <div className="mt-2 text-danger small">
              The AI returned malformed block JSON. Please try again.
            </div>
          ) : blocksResult && blocksResult.status === "pending" ? (
            <div className="mt-2 text-muted small">Generating blocks…</div>
          ) : (
            <div className="ai-chat-content" style={{ wordBreak: "break-word" }}>
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              ) : (
                <div className="text-muted small">
                  {message.tool_calls
                    ? "(used a tool to complete your request)"
                    : ""}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatMessage;

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    reasoning: PropTypes.string,
    content: PropTypes.string,
    tool_calls: PropTypes.array,
    tool_events: PropTypes.array,
  }).isRequired,
};
