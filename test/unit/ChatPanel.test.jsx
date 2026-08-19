import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup } from "@testing-library/react";
import PropTypes from "prop-types";

import createUsualStore from "../utils/StoreUtil";
import WrappingProvider from "../utils/WrappingProvider";
import { AIAgent } from "../../src/services/ai/AIAgent";
import ChatPanel from "../../src/components/AIChat/ChatPanel";

// ChatPanel imports the real agent; hoisted vi.mock replaces it. The mock is
// driven per-test via mockImplementation.
vi.mock("../../src/services/ai/AIAgent", () => ({
  AIAgent: { run: vi.fn(), requestInsertCode: vi.fn() },
  MAX_TURNS: 5,
}));

// Mock BlockPreviewRenderer: isBlocksJson is pure, use the real one;
// renderPreview returns a fake data URL so the live preview renders.
vi.mock("../../src/services/ai/BlockPreviewRenderer", async () => {
  const actual = await import("../../src/services/ai/BlockPreviewRenderer");
  return {
    ...actual,
    BlockPreviewRenderer: {
      renderPreview: vi.fn().mockResolvedValue("data:image/svg+xml,fake"),
    },
  };
});

// Bootstrap's Collapse keeps collapsed children in the DOM in some versions
// but out of the DOM in others; mock it so collapsed content is reliably
// absent from the DOM while `in` is false.
vi.mock("react-bootstrap", async () => {
  const actual = await import("react-bootstrap");
  const Collapse = ({ in: open, children }) =>
    open ? <>{children}</> : null;
  Collapse.displayName = "FakeCollapse";
  Collapse.propTypes = {
    in: PropTypes.bool,
    children: PropTypes.node,
  };
  return {
    ...actual,
    Collapse,
  };
});

const renderPanel = (store = createUsualStore()) => {
  return render(
    <WrappingProvider runtime={null} store={store}>
      <ChatPanel
        microworld="plots"
        projectData={[[1, 2]]}
        projectDataColumns={["X", "Y"]}
        onInsertCode={vi.fn()}
        toolContext={{ runtime: {}, editor: null, microworld: "plots" }}
      />
    </WrappingProvider>
  );
};

describe("ChatPanel", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default behavior for tests that don't override the agent: behave like
    // the old single-stream flow (content/reasoning chunks, then a message).
    AIAgent.run.mockImplementation(
      async ({ onContentChunk, onReasoningChunk, onComplete }) => {
        onContentChunk("Hello");
        onReasoningChunk("thinking...");
        onComplete({
          message: {
            role: "assistant",
            content: "Hello",
            reasoning: "thinking...",
          },
          toolEvents: [],
        });
      }
    );
  });

  it("should render the input field and Send/Clear buttons", () => {
    renderPanel();
    expect(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("should not call the agent when submitting an empty prompt", () => {
    renderPanel();
    fireEvent.click(screen.getByText("Send"));
    expect(AIAgent.run).not.toHaveBeenCalled();
  });

  it("should add the user message and stream when a prompt is submitted", async () => {
    const { container } = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "make a plot" } }
    );
    fireEvent.click(screen.getByText("Send"));

    // AIAgent.run should have been called with a system prompt + history + user msg.
    expect(AIAgent.run).toHaveBeenCalledTimes(1);
    const [options] = AIAgent.run.mock.calls[0];
    expect(options.messages[0].role).toBe("system");
    expect(
      options.messages.some(
        (m) => m.role === "user" && m.content === "make a plot"
      )
    ).toBe(true);
    expect(options.toolContext).toBeDefined();

    // The user message should now appear in the history.
    expect(container.textContent).toContain("make a plot");

    // After onComplete, the assistant message is added to history.
    await waitFor(() => {
      expect(container.textContent).toContain("Hello");
    });
    expect(container.textContent).toContain("AI Assistant");

    // The input should be cleared after sending.
    expect(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ).value
    ).toBe("");
  });

  it("should save the max-turns summary message even when no chunks streamed", async () => {
    // The MAX_TURNS fallback message is not a genuine model answer, but its
    // content summarizes the steps that did complete, so it must reach the
    // history even though no content chunks were streamed this turn.
    AIAgent.run.mockImplementation(
      async ({ onComplete }) => {
        onComplete({
          message: {
            role: "assistant",
            content:
              "I reached the maximum number of steps for one request, so I " +
              "stopped before finishing your full request. Here is what I " +
              "completed:\n- ✓ add a column named `bill_ratio` to the data table",
            reasoning: "",
            max_turns: true,
          },
          toolEvents: [
            {
              id: "c1",
              name: "addDataColumn",
              args: { column_name: "bill_ratio" },
              status: "done",
              description:
                "add a column named `bill_ratio` to the data table",
              result: "{\"success\":true}",
              confirmed: true,
            },
          ],
        });
      }
    );

    const { container } = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "make a plot" } }
    );
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(container.textContent).toContain("maximum number of steps");
    });
    expect(container.textContent).toContain("add a column named bill_ratio");
  });

  it("should show the 'AI is thinking...' placeholder while typing with no content yet", () => {
    AIAgent.run.mockImplementation(
      () =>
        new Promise(() => {
          // Never completes - keeps isTyping true.
        })
    );

    renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "hello" } }
    );
    fireEvent.click(screen.getByText("Send"));

    expect(screen.getByText("AI is thinking...")).toBeInTheDocument();
  });

  it("should display streamed reasoning and content while typing", async () => {
    let captured = null;
    AIAgent.run.mockImplementation(
      ({ onContentChunk, onReasoningChunk }) => {
        captured = { onContentChunk, onReasoningChunk };
        return new Promise(() => {
          // Keep isTyping true to observe the streaming UI.
        });
      }
    );

    const { container } = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "hello" } }
    );
    fireEvent.click(screen.getByText("Send"));

    // Drive the stream with a reasoning chunk then a content chunk. The AI
    // emits a preamble before the fenced JSON payload; the live view keeps
    // that preamble so the user retains context, but does not preview the
    // blocks themselves (they are shown once, in the confirmation card).
    act(() => {
      captured.onReasoningChunk("analyzing the request");
      captured.onContentChunk(
        "Here is your plot:\n```json\n" +
          "{ \"blocks\": { \"blocks\": [] } }" +
          "\n```"
      );
    });

    // "Thinking:" and the streamed reasoning render as separate elements
    // (the reasoning is markdown), so assert on each part individually.
    expect(container.textContent).toContain("Thinking:");
    expect(container.textContent).toContain("analyzing the request");
    // The preamble prose is kept in the live bubble, and no preview image
    // is rendered there (the preview lives only in the confirmation card).
    expect(container.textContent).toContain("Here is your plot:");
    expect(container.querySelector("img[alt=\"Block preview\"]")).toBeNull();
  });

  it("should show a 'Generating blocks…' placeholder while streaming incomplete JSON", async () => {
    let captured = null;
    AIAgent.run.mockImplementation(
      ({ onContentChunk, onReasoningChunk }) => {
        captured = { onContentChunk, onReasoningChunk };
        return new Promise(() => {
          // Keep isTyping true to observe the streaming UI.
        });
      }
    );

    const { container } = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "hello" } }
    );
    fireEvent.click(screen.getByText("Send"));

    // Drive the stream with a partial (incomplete) JSON chunk.
    act(() => {
      captured.onContentChunk("{ \"blocks\": { \"blocks\": [");
    });

    // Incomplete JSON should show the placeholder, not the raw text or a preview.
    expect(container.textContent).toContain("Generating blocks…");
    expect(container.querySelector("img[alt=\"Block preview\"]")).toBeNull();
    expect(container.textContent).not.toContain("{ \"blocks\": { \"blocks\": [");
  });

  it("should disable the Send button while the AI is typing", () => {
    AIAgent.run.mockImplementation(
      () =>
        new Promise(() => {
          // Never completes.
        })
    );

    renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "hello" } }
    );
    fireEvent.click(screen.getByText("Send"));

    expect(screen.getByText("Send")).toBeDisabled();
  });

  it("should clear the history when the Clear button is clicked", () => {
    // Pre-populate the store with a history message.
    const store = createUsualStore();
    store.dispatch({
      type: "ai_chat_message_added",
      payload: { role: "user", content: "old message" },
    });

    const { container } = renderPanel(store);
    expect(container.textContent).toContain("old message");

    fireEvent.click(screen.getByText("Clear"));

    expect(container.textContent).not.toContain("old message");
  });

  it("should render the blocks preamble in history but no Insert button", () => {
    const store = createUsualStore();
    store.dispatch({
      type: "ai_chat_message_added",
      payload: {
        role: "assistant",
        content:
          "Here is your plot:\n```json\n" +
          JSON.stringify({ blocks: { blocks: [] } }) +
          "\n```",
      },
    });

    renderPanel(store);
    // The prose is visible…
    expect(screen.getByText("Here is your plot:")).toBeInTheDocument();
    // …but there is no insert button: insertion only happens through the
    // Allow/Deny confirmation card.
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
  });

  it("should request insertCode permission when a turn ends with a blocks JSON answer", async () => {
    AIAgent.run.mockImplementation((options) => {
      return new Promise((resolve) => {
        options.onComplete({
          message: {
            role: "assistant",
            content:
              "Here is your plot:\n```json\n" +
              JSON.stringify({ blocks: { blocks: [{ id: "block_0" }] } }) +
              "\n```",
            reasoning: "",
          },
          toolEvents: [],
        });
        resolve();
      });
    });
    const requestMock = vi
      .spyOn(AIAgent, "requestInsertCode")
      .mockResolvedValue({ event: { id: "ins", status: "done" }, cancelled: false });

    const { container } = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "generate a plot" } }
    );
    act(() => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledTimes(1);
    });
    const codeArg = requestMock.mock.calls[0][0].code;
    expect(codeArg).toEqual({ blocks: { blocks: [{ id: "block_0" }] } });
    // The bubble keeps the preamble prose; no insert button is rendered.
    expect(container.textContent).toContain("Here is your plot:");
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
    requestMock.mockRestore();
  });

  it("should show an error message in the transcript when the insert request fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    AIAgent.run.mockImplementation((options) => {
      return new Promise((resolve) => {
        options.onComplete({
          message: {
            role: "assistant",
            content:
              "Here is your plot:\n```json\n" +
              JSON.stringify({ blocks: { blocks: [{ id: "block_0" }] } }) +
              "\n```",
            reasoning: "",
          },
          toolEvents: [],
        });
        resolve();
      });
    });
    const requestMock = vi
      .spyOn(AIAgent, "requestInsertCode")
      .mockRejectedValue(new Error("malformed blocks payload"));

    const { container } = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "generate a plot" } }
    );
    act(() => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledTimes(1);
    });
    // The failure is surfaced as a clear, user-facing message in the transcript.
    await waitFor(() => {
      expect(container.textContent).toContain("couldn't apply the code to the workspace");
    });
    // The live typing stream has been torn down after the request settled.
    await waitFor(() => {
      expect(screen.queryByText("AI is thinking...")).toBeNull();
    });
    requestMock.mockRestore();
    spy.mockRestore();
  });

  it("should pass the system prompt generated from the microworld and data", () => {
    AIAgent.run.mockImplementation(() => Promise.resolve());

    renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "test" } }
    );
    fireEvent.click(screen.getByText("Send"));

    const [options] = AIAgent.run.mock.calls[0];
    const systemMessage = options.messages[0];
    // AIContextManager.getSystemPrompt produces a prompt referencing the microworld.
    expect(systemMessage.content).toContain("Current Microworld: plots");
    expect(systemMessage.content).toContain("Dataset Context:");
  });

  it("should render live tool events in chronological order with the streamed text", async () => {
    let captured = null;
    AIAgent.run.mockImplementation((options) => {
      captured = options;
      // Never completes - keeps isTyping true so the live turn stays visible.
      return new Promise(() => {});
    });

    const { container } = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "what columns do I have?" } }
    );
    fireEvent.click(screen.getByText("Send"));

    // The model reasons, streams a line of content, then calls a tool. The
    // live turn must show them in that order (text before the tool chip).
    act(() => {
      captured.onReasoningChunk("let me inspect the columns");
      captured.onContentChunk("Looking at your table.");
      captured.onToolEvent({
        id: "call_1",
        name: "getDataColumns",
        args: {},
        status: "started",
        result: null,
      });
    });

    await waitFor(() => {
      expect(container.textContent).toContain("getDataColumns");
    });
    expect(container.textContent).toContain("working…");
    const stream = container.querySelector("[data-testid=\"ai-turn-stream\"]");
    const children = Array.from(stream.children).map((el) => el.textContent);
    expect(children).toEqual([
      "Thinking:let me inspect the columns",
      "Generating answer…Looking at your table.",
      "🔧 getDataColumnslooking up the data table's columnsworking…",
    ]);
  });

  it("should render a confirmation card for a pending mutating tool and resume on Allow", async () => {
    let resolveRun = null;
    let captured = null;
    AIAgent.run.mockImplementation((options) => {
      captured = options;
      return new Promise((resolve) => {
        resolveRun = resolve;
      });
    });

    const store = createUsualStore();
    const { container } = renderPanel(store);
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "add a column" } }
    );
    fireEvent.click(screen.getByText("Send"));

    // Emit a pending confirmation event; the agent pauses on the returned
    // promise. One live event object, mutated in place (matching the agent).
    const addEvent = {
      id: "call_add",
      name: "addDataColumn",
      args: { column_name: "total" },
      status: "pending_confirmation",
      description: "add a column named `total` to the data table",
      result: null,
    };
    let confirmationPromise = null;
    act(() => {
      confirmationPromise = captured.onToolEvent(addEvent);
    });

    // The confirmation card should be visible with a human-readable summary.
    await waitFor(() => {
      expect(screen.getByTestId("tool-confirmation-card")).toBeInTheDocument();
    });
    expect(container.textContent).toContain("AI agent wants to:");
    expect(container.textContent).toContain("add a column named `total`");
    expect(screen.getByTestId("tool-confirm-allow")).toBeInTheDocument();
    expect(screen.getByTestId("tool-confirm-deny")).toBeInTheDocument();

    // Clicking Allow resolves the confirmation promise.
    const resolved = [];
    confirmationPromise.then((d) => resolved.push(d));
    act(() => {
      fireEvent.click(screen.getByTestId("tool-confirm-allow"));
    });
    await waitFor(() => {
      expect(resolved).toEqual([{ allowed: true }]);
    });

    // The agent marks the event done in place once it has executed.
    act(() => {
      addEvent.status = "done";
      addEvent.result = "{\"success\":true}";
      addEvent.confirmed = true;
      captured.onToolEvent(addEvent);
    });

    // Now complete the agent run; the card goes away and typing ends.
    // The transcript must preserve the tool call (with the allowed outcome)
    // as part of the saved history, alongside the final message.
    act(() => {
      captured.onComplete({
        message: { role: "assistant", content: "Done." },
        toolEvents: [],
      });
      resolveRun();
    });
    await waitFor(() => {
      expect(screen.queryByTestId("tool-confirmation-card")).toBeNull();
    });
    // The tool call stays in the transcript with its allowed outcome.
    // The saved tool chip shows the human-readable description and outcome
    // (the raw tool name is not repeated on the chip).
    expect(container.textContent).toContain("✓ done");
    expect(container.textContent).toContain("add a column named `total`");
    // The tool message is present in the saved history with the allowed outcome.
    const history = store.getState().aiChat.history;
    const toolMsgs = history.filter((m) => m.tool_events);
    expect(toolMsgs).toHaveLength(1);
    expect(toolMsgs[0].tool_events[0].id).toBe("call_add");
    expect(toolMsgs[0].tool_events[0].confirmed).toBe(true);
  });

  it("should resolve a pending confirmation as declined when the history is cleared", async () => {
    let captured = null;
    AIAgent.run.mockImplementation((options) => {
      captured = options;
      return new Promise(() => {
        // Never resolves on its own; the turn ends via the cancellation path.
      });
    });

    const { container } = renderPanel();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "add a column" } }
    );
    fireEvent.click(screen.getByText("Send"));

    let confirmationPromise = null;
    act(() => {
      confirmationPromise = captured.onToolEvent({
        id: "call_add",
        name: "addDataColumn",
        args: { column_name: "total" },
        status: "pending_confirmation",
        description: "add a column named `total` to the data table",
        result: null,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId("tool-confirmation-card")).toBeInTheDocument();
    });

    // Clearing the history while a confirmation is pending should decline it
    // and discard the partial transcript. (The agent's cancellation path is
    // async, so poll for the cleared state.)
    const resolved = [];
    confirmationPromise.then((d) => resolved.push(d));
    act(() => {
      fireEvent.click(screen.getByText("Clear"));
    });
    await waitFor(() => {
      expect(resolved).toEqual([{ allowed: false }]);
    });
    await waitFor(() => {
      expect(container.textContent).not.toContain("addDataColumn");
    });
  });

  it("should convert the saved transcript to API-safe messages before sending", async () => {
    const store = createUsualStore();
    // Seed the history exactly as a tool-using turn saves it: an assistant
    // tool step (no content, no tool_calls — invalid for the API), a final
    // answer, and a new user message.
    store.dispatch({
      type: "ai_chat_message_added",
      payload: {
        role: "assistant",
        content: undefined,
        reasoning: "let me check the columns first",
        tool_events: [
          {
            id: "call_1",
            name: "getDataColumns",
            args: {},
            status: "done",
            result:
              "{\"columns\":[{\"name\":\"X\",\"type\":\"number\"}]}",
          },
        ],
      },
    });
    store.dispatch({
      type: "ai_chat_message_added",
      payload: {
        role: "assistant",
        content: "Your table has one column: X.",
        reasoning: "",
      },
    });

    renderPanel(store);
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "now plot it" } }
    );
    fireEvent.click(screen.getByText("Send"));

    const [options] = AIAgent.run.mock.calls[0];
    const messages = options.messages;

    // Every assistant message sent to the API must carry content (a message
    // with neither content nor tool_calls is rejected with a 400).
    for (const m of messages) {
      if (m.role === "assistant") {
        expect(typeof m.content).toBe("string");
        expect(m.content.length).toBeGreaterThan(0);
      }
    }

    // The tool step is converted to a compact text summary that keeps the
    // tool's result, instead of the raw tool_events object.
    const toolStep = messages.find((m) =>
      (m.content || "").includes("Tool call getDataColumns")
    );
    expect(toolStep).toBeDefined();
    expect(toolStep.content).toContain("\"columns\"");
    expect(toolStep.tool_events).toBeUndefined();
    expect(toolStep.reasoning).toBeUndefined();

    // The final answer and the new user message are preserved.
    expect(
      messages.some((m) => m.role === "assistant" && m.content === "Your table has one column: X.")
    ).toBe(true);
    expect(
      messages.some((m) => m.role === "user" && m.content === "now plot it")
    ).toBe(true);
  });

  it("should summarize vision tool results in the replayed transcript", async () => {
    const store = createUsualStore();
    store.dispatch({
      type: "ai_chat_message_added",
      payload: {
        role: "assistant",
        content: undefined,
        reasoning: undefined,
        tool_events: [
          {
            id: "call_v1",
            name: "getVisualizationImage",
            args: {},
            status: "done",
            result: JSON.stringify({
              image: `data:image/png;base64,${"x".repeat(2000)}`,
              width: 800,
            }),
          },
        ],
      },
    });

    renderPanel(store);
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "what does it show?" } }
    );
    fireEvent.click(screen.getByText("Send"));

    const [options] = AIAgent.run.mock.calls[0];
    const toolStep = options.messages.find((m) =>
      (m.content || "").includes("Tool call getVisualizationImage")
    );
    expect(toolStep).toBeDefined();
    // The image payload itself must never be replayed to the API.
    expect(toolStep.content).not.toContain("data:image/png;base64");
    expect(toolStep.content).toContain("returned a chart image");
  });

  it("should save a chronological transcript: interleaved assistant steps with tool calls and their outcomes", async () => {
    const store = createUsualStore();
    let captured = null;
    let resolveRun = null;
    AIAgent.run.mockImplementation((options) => {
      captured = options;
      return new Promise((resolve) => {
        resolveRun = resolve;
      });
    });

    const { container } = render(
      <WrappingProvider runtime={null} store={store}>
        <ChatPanel
          microworld="plots"
          projectData={[[1, 2]]}
          projectDataColumns={["X", "Y"]}
          onInsertCode={vi.fn()}
          toolContext={{ runtime: {}, editor: null, microworld: "plots" }}
        />
      </WrappingProvider>
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "add a column and code" } }
    );
    fireEvent.click(screen.getByText("Send"));

    // Step 1: the model reasons, asks to add a column; the user allows it.
    // One live event object per tool call, mutated in place (matching the
    // real agent), so the live list never accumulates stale duplicates.
    act(() => {
      captured.onReasoningChunk("I should add the column first");
    });
    const addEvent = {
      id: "call_add",
      name: "addDataColumn",
      args: { column_name: "total" },
      status: "started",
      result: null,
    };
    act(() => {
      captured.onToolEvent(addEvent);
    });
    let confirmationPromise = null;
    act(() => {
      addEvent.status = "pending_confirmation";
      addEvent.description = "add a column named `total` to the data table";
      confirmationPromise = captured.onToolEvent(addEvent);
    });
    await waitFor(() => {
      expect(screen.getByTestId("tool-confirmation-card")).toBeInTheDocument();
    });
    const resolved = [];
    confirmationPromise.then((d) => resolved.push(d));
    act(() => {
      fireEvent.click(screen.getByTestId("tool-confirm-allow"));
    });
    await waitFor(() => {
      expect(resolved).toEqual([{ allowed: true }]);
    });
    // The agent marks the event done in place once it has executed.
    act(() => {
      addEvent.status = "done";
      addEvent.result = "{\"success\":true}";
      addEvent.confirmed = true;
      captured.onToolEvent(addEvent);
    });

    // Step 2: the model then asks to insert code, which the user declines.
    act(() => {
      captured.onReasoningChunk("now let me generate the code");
    });
    const codeEvent = {
      id: "call_code",
      name: "insertCode",
      args: { code: { blocks: { blocks: [] } } },
      status: "started",
      result: null,
    };
    act(() => {
      captured.onToolEvent(codeEvent);
    });
    let secondPromise = null;
    act(() => {
      codeEvent.status = "pending_confirmation";
      codeEvent.description = "insert the code shown in the preview";
      secondPromise = captured.onToolEvent(codeEvent);
    });
    await waitFor(() => {
      expect(screen.getByTestId("tool-confirmation-card")).toBeInTheDocument();
    });
    const secondResolved = [];
    secondPromise.then((d) => secondResolved.push(d));
    act(() => {
      fireEvent.click(screen.getByTestId("tool-confirm-deny"));
    });
    await waitFor(() => {
      expect(secondResolved).toEqual([{ allowed: false }]);
    });
    act(() => {
      codeEvent.status = "done";
      codeEvent.result = "The user declined this action.";
      codeEvent.confirmed = false;
      captured.onToolEvent(codeEvent);
    });

    // The final answer arrives.
    act(() => {
      captured.onContentChunk("I added the column but skipped the code.");
      captured.onComplete({
        message: {
          role: "assistant",
          content: "I added the column but skipped the code.",
          reasoning: "",
        },
        toolEvents: [],
      });
      resolveRun();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("tool-confirmation-card")).toBeNull();
    });

    // Both tool calls remain in the saved transcript, with their outcomes.
    // The saved tool chips show the human-readable description and the
    // outcome (the raw tool name is not repeated on the chip).
    expect(container.textContent).toContain("✓ done");
    expect(container.textContent).toContain("✗ declined by user");
    expect(container.textContent).toContain("add a column named `total`");
    expect(container.textContent).toContain("insert the code shown in the preview");
    const history = store.getState().aiChat.history;
    // Each tool call is its own message; the reasoning/content that streamed
    // before it is attributed to that message (not a separate bubble), so the
    // final answer is saved exactly once and nothing is duplicated.
    const toolMsgs = history.filter((m) => m.tool_events);
    expect(toolMsgs).toHaveLength(2);
    expect(toolMsgs[0].tool_events[0].id).toBe("call_add");
    expect(toolMsgs[0].reasoning).toBe("I should add the column first");
    expect(toolMsgs[1].tool_events[0].id).toBe("call_code");
    expect(toolMsgs[1].reasoning).toBe("now let me generate the code");
    // The transcript reads in chronological order: the two tool steps (each
    // carrying its lead-in reasoning), then the final answer. (The user
    // message is excluded from this ordering check.)
    const kinds = history
      .filter((m) => m.role === "assistant")
      .map((m) => (m.tool_events ? "tool" : m.reasoning ? "reasoning" : "content"));
    expect(kinds).toEqual(["tool", "tool", "content"]);
  });

  it("should save the final answer exactly once after a tool-using turn", async () => {
    const store = createUsualStore();
    AIAgent.run.mockImplementation((options) => {
      return new Promise((resolve) => {
        // Simulate a tool-using turn: one tool event, then the final answer.
        const event = {
          id: "call_once",
          name: "getDataColumns",
          args: {},
          status: "started",
          result: null,
        };
        options.onToolEvent(event);
        event.status = "done";
        event.result = "{}";
        options.onToolEvent(event);
        options.onContentChunk("Here is your answer.");
        options.onComplete({
          message: {
            role: "assistant",
            content: "Here is your answer.",
            reasoning: "",
          },
          toolEvents: [],
        });
        resolve();
      });
    });

    renderPanel(store);
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "what columns do I have?" } }
    );
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(store.getState().aiChat.history.length).toBeGreaterThan(0);
    });

    const history = store.getState().aiChat.history;
    // The final answer must appear exactly once (not duplicated by the
    // transcript), plus the tool-step message and the user message.
    const answerMessages = history.filter(
      (m) => m.content === "Here is your answer."
    );
    expect(answerMessages).toHaveLength(1);
    const toolMsgs = history.filter((m) => m.tool_events);
    expect(toolMsgs).toHaveLength(1);
    expect(history).toHaveLength(3);
  });

  it("should not save an empty assistant message when the final answer has no content", async () => {
    const store = createUsualStore();
    AIAgent.run.mockImplementation((options) => {
      return new Promise((resolve) => {
        const event = {
          id: "call_empty",
          name: "getDataColumns",
          args: {},
          status: "started",
          result: null,
        };
        options.onToolEvent(event);
        event.status = "done";
        event.result = "{}";
        options.onToolEvent(event);
        // The model produced no content for the final answer (a hiccup).
        options.onComplete({
          message: { role: "assistant", content: "", reasoning: "" },
          toolEvents: [],
        });
        resolve();
      });
    });

    renderPanel(store);
    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask AI to generate blocks, explain your data, or brainstorm questions..."
      ),
      { target: { value: "what columns do I have?" } }
    );
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(store.getState().aiChat.history.length).toBeGreaterThan(0);
    });

    const history = store.getState().aiChat.history;
    // No assistant message without content or tool events may be saved;
    // such a message would break the next API call.
    const empty = history.filter(
      (m) =>
        m.role === "assistant" &&
        !(typeof m.content === "string" && m.content.trim().length > 0) &&
        !(m.tool_events && m.tool_events.length > 0)
    );
    expect(empty).toHaveLength(0);
    // The tool step itself is still recorded (and it is the only message,
    // since the empty final answer is not saved).
    expect(history).toHaveLength(2);
    expect(history.filter((m) => m.tool_events)).toHaveLength(1);
  });
});
