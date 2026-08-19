import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Container, Form, InputGroup, Button, Card, Spinner } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatMessage from "./ChatMessage";
import ToolCallConfirmationCard from "./ToolCallConfirmationCard";
import { AIContextManager } from "../../services/ai/AIContextManager";
import { AIAgent } from "../../services/ai/AIAgent";
import { resetUsage } from "../../services/ai/AIService";
import { isBlocksJson } from "../../services/ai/BlockPreviewRenderer";
import summarizeToolCall from "./summarizeToolCall";
import * as actionCreators from "../../redux/actionCreators";

/**
 * Renders one saved tool event as a short human-readable line, for the
 * API-view of the history (see {@link toApiMessage}). This is what the
 * model sees in place of the structured tool transcript on the next turn.
 */
const formatToolEvent = (event) => {
  const summary = event.description || summarizeToolCall(event.name, event.args);
  let outcome;
  if (event.status !== "done") {
    outcome = "(no result was recorded)";
  } else if (event.confirmed === false) {
    outcome = "declined by the user";
  } else if (event.error) {
    outcome = `failed: ${event.error}`;
  } else if (event.result) {
    let text = event.result;
    // Tool results that carry an image (the vision tool) would blow up the
    // replayed history if included verbatim; summarize them instead. The
    // image itself is only needed while the live turn is in flight.
    if (text.includes("\"image\":\"data:image/")) {
      outcome = "returned a chart image (see the visualization panel)";
    } else if (text.length > 500) {
      text = `${text.slice(0, 500)}… (truncated)`;
      outcome = `returned: ${text}`;
    } else {
      outcome = `returned: ${text}`;
    }
  } else {
    outcome = "completed";
  }
  return `- Tool call ${event.name} (${summary}) ${outcome}`;
};

/**
 * Converts a saved chat history message into its OpenAI-API-compatible
 * equivalent. The UI transcript stores extra fields (reasoning, tool_events)
 * that the API rejects on assistant messages, so the transcript must never
 * be replayed verbatim: assistant tool steps become a compact text summary,
 * and every assistant message is guaranteed to carry `content`.
 *
 * @param {Object} message A message from the chat history.
 * @returns {Object} An API-safe message ({ role, content }).
 */
const toApiMessage = (message) => {
  if (message.role !== "assistant") {
    return { role: message.role, content: message.content || "" };
  }
  const parts = [];
  const toolLines =
    message.tool_events && message.tool_events.length > 0
      ? "Tool calls made for this request:\n" +
        message.tool_events.map(formatToolEvent).join("\n")
      : "";
  if (toolLines) {
    parts.push(toolLines);
  }
  if (typeof message.content === "string" && message.content.trim().length > 0) {
    parts.push(message.content);
  } else if (!toolLines) {
    // No tool calls and no content: keep a placeholder so the assistant
    // message always has content (an assistant message with neither
    // content nor tool_calls is rejected by the API).
    parts.push("(The assistant did not produce a response.)");
  }
  return { role: "assistant", content: parts.join("\n\n") };
};

/**
 * Renders a single in-flight tool event while the assistant turn is still
 * running. A mutating tool awaiting the user's decision shows the
 * confirmation card; every other state shows a compact status chip.
 */
const LiveToolEvent = ({ event, projectDataColumns, onDecision }) => {
  if (event.status === "pending_confirmation") {
    return (
      <ToolCallConfirmationCard
        event={event}
        projectDataColumns={projectDataColumns}
        onDecision={(allowed) => onDecision(event.id, allowed)}
      />
    );
  }
  return (
    <Card
      className="border-info small mb-1"
      style={{ maxWidth: "80%" }}
    >
      <Card.Body className="py-1 px-2">
        <span className="fw-bold me-1">🔧 {event.name}</span>
        <span className="text-muted me-1">
          {event.description || summarizeToolCall(event.name, event.args)}
        </span>
        {event.status === "done" ? (
          event.confirmed === false ? (
            <span className="text-danger">✗ declined by user</span>
          ) : event.error ? (
            <span className="text-danger">✗ {event.error}</span>
          ) : (
            <span className="text-success">✓ done</span>
          )
        ) : (
          <span className="text-warning d-inline-flex align-items-center">
            <Spinner animation="border" size="sm" role="status" className="me-1" />
            working…
          </span>
        )}
      </Card.Body>
    </Card>
  );
};

LiveToolEvent.propTypes = {
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
  projectDataColumns: PropTypes.array,
  onDecision: PropTypes.func.isRequired,
};

/**
 * Renders one in-flight content segment while the assistant turn is still
 * running. A completed, valid Blockly payload is shown as its preamble prose
 * (plus a "blocks are ready" hint); a malformed payload is flagged; otherwise
 * the markdown answer is streamed. The blocks themselves are never previewed
 * in the live bubble — they are shown once in the Allow/Deny confirmation
 * card (see {@link ToolCallConfirmationCard}) when the turn ends.
 */
const LiveContent = ({ text }) => {
  const result = isBlocksJson(text);
  if (result.status === "ok") {
    return (
      <div
        className="bg-light p-2 rounded mb-2"
        style={{ maxWidth: "80%", wordBreak: "break-word" }}
      >
        {result.prose ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.prose}</ReactMarkdown>
        ) : (
          <div className="text-muted small">
            Blocks are ready — approve them in the card below.
          </div>
        )}
      </div>
    );
  }
  if (result.status === "invalid") {
    return (
      <div
        className="bg-light p-2 rounded mb-2 text-danger small"
        style={{ maxWidth: "80%" }}
      >
        The AI returned malformed block JSON. Please try again.
      </div>
    );
  }
  return (
    <div
      className="bg-light p-2 rounded mb-2"
      style={{ maxWidth: "80%", wordBreak: "break-word" }}
    >
      <div className="text-muted small d-inline-flex align-items-center">
        <Spinner animation="border" size="sm" role="status" className="me-1" />
        {result.status === "pending" ? "Generating blocks…" : "Generating answer…"}
      </div>
      {result.status === "none" && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      )}
      {result.status === "pending" && result.prose && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.prose}</ReactMarkdown>
      )}
    </div>
  );
};

LiveContent.propTypes = {
  text: PropTypes.string.isRequired,
};

const ChatPanel = ({
  aiChat,
  addMessage,
  setTyping,
  clearHistory,
  microworld,
  projectData,
  projectDataColumns,
  toolContext,
}) => {
  const [prompt, setPrompt] = useState("");
  const scrollRef = useRef(null);
  // The ordered stream of the in-flight turn: text segments ({ type: "text",
  // kind, text }) and tool events ({ type: "tool", event }) in the exact order
  // they arrived. Kept in a ref (the source of truth) with a version counter
  // to trigger re-renders, so both the live view and the saved transcript are
  // derived from the same chronologically accurate record.
  const turnStreamRef = useRef([]);
  const [turnStreamVersion, setTurnStreamVersion] = useState(0);

  // Tracks whether the current agent turn has been cancelled (the user
  // cleared the history while the agent was running, e.g. while waiting for
  // a tool confirmation). The agent loop checks this via a callback so a
  // pending confirmation can never re-trigger the UI after a clear.
  const turnCancelledRef = useRef(false);
  // Pending tool confirmations: event id -> resolve({ allowed }). Kept in a
  // ref (not state) so the decision handler is stable across renders.
  const pendingConfirmationsRef = useRef(new Map());
  // The open (not yet closed) text segment of the current turn, so streaming
  // chunks can be appended without building a new stream per chunk.
  const openSegmentRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiChat.history, turnStreamVersion]);

  // Records a tool event (first sighting or a later status change) in the
  // turn stream and, for a pending confirmation, returns the promise that
  // resolves when the user clicks Allow/Deny on the confirmation card. Shared
  // by the in-flight agent loop and the post-turn insertCode request so both
  // behave identically (same live rendering, same pending-confirmation map).
  const recordToolEvent = (event) => {
    const existing = turnStreamRef.current.find(
      (item) => item.type === "tool" && item.event.id === event.id
    );
    if (!existing) {
      // First sighting of this tool call: close any open text segment so the
      // next chunk of reasoning/content starts a fresh segment (a tool call
      // is a boundary between distinct reasoning steps), then record the
      // event *after* any text that streamed before it so the transcript
      // keeps the true order (reasoning -> content -> tool).
      openSegmentRef.current = null;
      turnStreamRef.current.push({ type: "tool", event });
    }
    // Bump on every emission (first sighting *and* later status changes) so a
    // mutation to an already-recorded event re-renders the live view.
    setTurnStreamVersion((v) => v + 1);
    if (event.status === "pending_confirmation") {
      return new Promise((resolve) => {
        pendingConfirmationsRef.current.set(event.id, resolve);
      });
    }
    return undefined;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = { role: "user", content: prompt };
    addMessage(userMessage);
    setTyping(true);
    setPrompt("");
    turnStreamRef.current = [];
    setTurnStreamVersion((v) => v + 1);
    openSegmentRef.current = null;
    turnCancelledRef.current = false;

    const systemPrompt = AIContextManager.getSystemPrompt(
      microworld,
      projectData,
      projectDataColumns
    );

    const messages = [
      { role: "system", content: systemPrompt },
      // The saved transcript is for the UI; convert it to API-safe messages
      // (assistant tool steps are summarized, empty content is replaced)
      // before it is replayed into the model request.
      ...aiChat.history.map(toApiMessage),
      userMessage,
    ];

    // Append a chunk of streamed reasoning or content to the turn stream.
    // Consecutive chunks of the same kind accumulate in the current open
    // segment; a kind switch (e.g. reasoning -> content) closes the open
    // segment so the two remain distinct in the transcript.
    const appendChunk = (kind, chunk) => {
      const open = openSegmentRef.current;
      if (open && open.kind === kind) {
        open.text += chunk;
      } else {
        // Close the open segment (if any) so a kind switch keeps the two
        // distinct in the transcript, and start the new one.
        const segment = { type: "text", kind, text: chunk };
        openSegmentRef.current = segment;
        turnStreamRef.current.push(segment);
      }
      setTurnStreamVersion((v) => v + 1);
    };

    // Builds the saved history messages for this turn from the in-flight
    // stream (the source of truth, read from the ref so it is accurate even
    // when this callback fires synchronously before React re-renders) plus the
    // final answer.
    //
    // The final answer is saved exactly once, at the end. Any text that
    // streamed *before* a tool call is attributed to that tool's message (so
    // the reasoning/content that led to the call stays with it), rather than
    // being duplicated as a separate message. This keeps the transcript
    // chronologically accurate without repeating the final answer.
    const buildTurnTranscript = (finalMessage) => {
      const stream = turnStreamRef.current;
      const transcript = [];
      const toolIndexes = [];
      stream.forEach((item, i) => {
        if (item.type === "tool") toolIndexes.push(i);
      });
      toolIndexes.forEach((idx, i) => {
        // The text segments that streamed since the previous tool call (or the
        // start of the turn) up to this one are the reasoning/content that
        // led to this call, so they are attributed to it.
        const prevIdx = i === 0 ? -1 : toolIndexes[i - 1];
        const reasoningParts = [];
        const contentParts = [];
        for (let j = prevIdx + 1; j < idx; j += 1) {
          const seg = stream[j];
          const trimmed = (seg.text || "").trim();
          if (!trimmed) continue;
          if (seg.kind === "reasoning") {
            reasoningParts.push(trimmed);
          } else {
            contentParts.push(trimmed);
          }
        }
        const msg = { role: "assistant", tool_events: [stream[idx].event] };
        if (reasoningParts.length) {
          msg.reasoning = reasoningParts.join("\n\n");
        }
        if (contentParts.length) {
          msg.content = contentParts.join("\n\n");
        }
        transcript.push(msg);
      });
      transcript.push(finalMessage);
      return transcript;
    };

    await AIAgent.run({
      messages,
      toolContext,
      onContentChunk: (chunk) => {
        appendChunk("content", chunk);
      },
      onReasoningChunk: (chunk) => {
        appendChunk("reasoning", chunk);
      },
      onToolEvent: recordToolEvent,
      onComplete: (result) => {
        const final = result.message;
        const transcript = buildTurnTranscript(final);
        // Every transcript piece except the last (the final answer) is a step
        // of the turn (a text segment or a tool call); add those first so the
        // history reads in order.
        for (let i = 0; i < transcript.length - 1; i += 1) {
          addMessage(transcript[i]);
        }
        // Skip the final answer when the model produced no content at all:
        // an assistant message with neither content nor tool calls is
        // invalid for the next API call, and an empty bubble is useless in
        // the transcript. The tool chips above already record what happened.
        // The MAX_TURNS fallback message is the exception: its content is a
        // summary of the steps that did complete, which is worth showing
        // even though it is not a genuine model answer.
        const hasContent =
          typeof final.content === "string" && final.content.trim().length > 0;
        if (hasContent || final.max_turns) {
          addMessage(final);
        }
        // When the turn ends with a blocks payload as the final answer, ask
        // the user to approve loading it into the editor. There is no direct
        // insert path: the Allow/Deny card (rendered in the live stream via
        // recordToolEvent) is the only way blocks reach the workspace.
        //
        // The live stream is deliberately *not* cleared before the request
        // starts: the "blocks are ready" badge (or preamble prose) stays on
        // screen until the confirmation card appears, so there is no blank
        // moment between the content finishing and the card showing. The
        // request's own cleanup (finishTurnSafe in its finally block) ends
        // the turn. Otherwise, end the turn right away.
        const blocks = isBlocksJson(
          typeof final.content === "string" ? final.content : ""
        );
        if (blocks.status === "ok" && !turnCancelledRef.current) {
          requestBlocksInsert(blocks.json);
        } else {
          finishTurnSafe();
        }
      },
      onError: (error) => {
        console.error("AI Error:", error);
        finishTurnSafe();
      },
      isCancelled: () => turnCancelledRef.current,
      onConfirmationTimeout: finishTurnSafe,
    });
  };

  const handleClear = () => {
    // If a turn is in flight, mark it cancelled: the agent loop stops before
    // making further model calls or executing mutations. Any pending
    // confirmation is resolved as declined right away (so its card cannot
    // outlive the cleared state) and the typing state is reset.
    turnCancelledRef.current = true;
    pendingConfirmationsRef.current.forEach((resolve) =>
      resolve({ allowed: false })
    );
    pendingConfirmationsRef.current.clear();
    setTyping(false);
    turnStreamRef.current = [];
    setTurnStreamVersion((v) => v + 1);
    openSegmentRef.current = null;
    // A cleared history starts a new session: reset the developer-facing
    // token-usage accumulators (per-turn and session), no-op outside dev.
    resetUsage(true);
    clearHistory();
  };

  // Resolves the pending confirmation for the given tool event id, allowing
  // the agent loop to continue. Stable across renders (reads from a ref),
  // so it can be passed to the tool event list on every render.
  const handleConfirmationDecision = (id, allowed) => {
    const resolve = pendingConfirmationsRef.current.get(id);
    if (resolve) {
      pendingConfirmationsRef.current.delete(id);
      resolve({ allowed });
    }
  };

  // Requests the user's permission to load blocks the assistant returned in
  // its final answer. Runs the same validation/confirmation/execution path as
  // a model-initiated insertCode call: the Allow/Deny card is rendered in the
  // live stream (via recordToolEvent), and the outcome is saved to the
  // history as a tool step so the transcript records the decision.
  const requestBlocksInsert = async (code) => {
    // The typing state is already on from the streaming phase and the live
    // stream still shows the "blocks are ready" badge; leave both as they are
    // so there is no blank moment before the confirmation card appears.
    try {
      const { event, cancelled } = await AIAgent.requestInsertCode({
        code,
        toolContext,
        onToolEvent: recordToolEvent,
        isCancelled: () => turnCancelledRef.current,
      });
      if (!cancelled && event && event.status === "done") {
        addMessage({ role: "assistant", tool_events: [event] });
      }
    } catch (error) {
      // If the insert request itself fails (e.g. the blocks payload is
      // malformed despite the earlier check), surface a clear message so the
      // user is not left wondering what happened. This is an unexpected
      // failure path, so also log it for debugging.
      console.error("AI: failed to request code insertion:", error);
      addMessage({
        role: "assistant",
        content:
          "I'm sorry, but I couldn't apply the code to the workspace. " +
          "Please try again.",
      });
    } finally {
      // The live stream is per-turn; once the request settles, hand the area
      // back to the saved history (the tool step above, if any).
      finishTurnSafe();
    }
  };

  // finishTurn lives inside handleSend; this reset does the same state
  // cleanup (typing off, live stream cleared, any stragglers denied) so the
  // post-turn insert request can share it.
  const finishTurnSafe = () => {
    setTyping(false);
    turnStreamRef.current = [];
    setTurnStreamVersion((v) => v + 1);
    openSegmentRef.current = null;
    pendingConfirmationsRef.current.forEach((resolve) =>
      resolve({ allowed: false })
    );
    pendingConfirmationsRef.current.clear();
  };

  return (
    <div className="ai-chat-panel h-100 bg-white">
      <Container fluid className="h-100 d-flex flex-column p-3">
        <div ref={scrollRef} className="flex-grow-1 overflow-auto mb-3">
          {aiChat.history.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          {aiChat.isTyping && (
            <div className="d-flex flex-column" data-testid="ai-turn-stream">
              {turnStreamRef.current.map((item, idx) => {
                if (item.type === "tool") {
                  return (
                    <LiveToolEvent
                      key={item.event.id}
                      event={item.event}
                      projectDataColumns={projectDataColumns}
                      onDecision={handleConfirmationDecision}
                    />
                  );
                }
                if (item.kind === "reasoning") {
                  return (
                    <div key={idx} className="small italic text-muted mb-2">
                      <div className="fw-bold">Thinking:</div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>
                    </div>
                  );
                }
                return (
                  <LiveContent key={idx} text={item.text} />
                );
              })}
              {turnStreamRef.current.length === 0 && (
                <div className="text-muted small mb-2 d-inline-flex align-items-center">
                  <Spinner animation="border" size="sm" role="status" className="me-1" />
                  AI is thinking...
                </div>
              )}
            </div>
          )}
        </div>

        <Form onSubmit={handleSend}>
          <InputGroup>
            <Form.Control
              placeholder="Ask AI to generate blocks, explain your data, or brainstorm questions..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button variant="primary" type="submit" disabled={aiChat.isTyping}>
              Send
            </Button>
            <Button variant="outline-secondary" onClick={handleClear}>
              Clear
            </Button>
          </InputGroup>
        </Form>
      </Container>
    </div>
  );
};

const mapStateToProps = (state) => ({
  aiChat: state.aiChat,
});

const mapDispatchToProps = (dispatch) => ({
  addMessage: (msg) => dispatch(actionCreators.ai_chat_message_added(msg)),
  setTyping: (typing) => dispatch(actionCreators.ai_chat_set_typing(typing)),
  clearHistory: () => dispatch(actionCreators.ai_chat_history_cleared()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatPanel);

ChatPanel.propTypes = {
  aiChat: PropTypes.shape({
    history: PropTypes.array.isRequired,
    isTyping: PropTypes.bool.isRequired,
  }).isRequired,
  addMessage: PropTypes.func.isRequired,
  setTyping: PropTypes.func.isRequired,
  clearHistory: PropTypes.func.isRequired,
  microworld: PropTypes.string.isRequired,
  projectData: PropTypes.array,
  projectDataColumns: PropTypes.array,
  toolContext: PropTypes.shape({
    runtime: PropTypes.object,
    editor: PropTypes.object,
    visualizer: PropTypes.object,
    microworld: PropTypes.string,
  }),
};
