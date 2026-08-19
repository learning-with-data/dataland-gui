import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock BlockPreviewRenderer so tests don't require a real Blockly render.
// isBlocksJson is a pure function, so use the real implementation.
vi.mock("../../src/services/ai/BlockPreviewRenderer", async () => {
  const { isBlocksJson } = await import(
    "../../src/services/ai/BlockPreviewRenderer"
  ).catch(() => ({ isBlocksJson: null }));
  return {
    BlockPreviewRenderer: {
      renderPreview: vi.fn().mockResolvedValue(""),
    },
    isBlocksJson,
  };
});

import ChatMessage from "../../src/components/AIChat/ChatMessage";

describe("ChatMessage", () => {
  it("should render a user message on the right with the 'You' label", () => {
    render(
      <ChatMessage
        message={{ role: "user", content: "hello there" }}
      />
    );
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("hello there")).toBeInTheDocument();
    // No Insert button for user messages (content is not JSON)
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
  });

  it("should not render anything for a message with no content, reasoning, or tool events", () => {
    const { container } = render(
      <ChatMessage
        message={{ role: "assistant", content: "", reasoning: "" }}
      />
    );
    // An empty assistant bubble must not appear in the transcript.
    expect(container.querySelector(".card")).toBeNull();
    expect(container.querySelector(".ai-chat-content")).toBeNull();
  });

  it("should render an assistant message on the left with the 'AI Assistant' label", () => {
    render(
      <ChatMessage
        message={{ role: "assistant", content: "hi, how can I help?" }}
      />
    );
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(screen.getByText("hi, how can I help?")).toBeInTheDocument();
  });

  it("should render the reasoning block (collapsed by default) when present", () => {
    const { container } = render(
      <ChatMessage
        message={{
          role: "assistant",
          content: "answer",
          reasoning: "let me think...",
        }}
      />
    );
    // The reasoning text is in the DOM (inside the Collapse).
    expect(container.textContent).toContain("let me think...");
    const toggle = screen.getByRole("button", { name: /reasoning/i });
    // It starts collapsed. (Bootstrap CSS isn't loaded in jsdom, so assert
    // on aria-expanded rather than computed visibility.)
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    // Expanding via the toggle makes it expanded.
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("should not show a reasoning block when reasoning is absent", () => {
    const { container } = render(
      <ChatMessage
        message={{ role: "assistant", content: "answer" }}
      />
    );
    // No element with the reasoning styling
    expect(container.querySelector(".italic.text-muted")).toBeNull();
  });

  it("should let the user expand and collapse the reasoning", () => {
    render(
      <ChatMessage
        message={{
          role: "assistant",
          content: "answer",
          reasoning: "abc",
        }}
      />
    );
    const toggle = screen.getByRole("button", { name: /reasoning/i });
    // Starts collapsed.
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    // Toggle open.
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    // Toggle closed again.
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("should render reasoning as markdown", () => {
    render(
      <ChatMessage
        message={{
          role: "assistant",
          content: "",
          reasoning: "a **bold** thought",
        }}
      />
    );
    expect(screen.getByText("bold")).toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
  });

  it("should show the preamble prose (not the raw JSON) when content is fenced blocks JSON", () => {
    const jsonContent =
      "Here is your plot:\n```json\n" +
      JSON.stringify({ blocks: { blocks: [{ id: "block_0" }] } }) +
      "\n```";
    const { container } = render(
      <ChatMessage
        message={{ role: "assistant", content: jsonContent }}
      />
    );
    // The preamble prose is shown…
    expect(screen.getByText("Here is your plot:")).toBeInTheDocument();
    // …but the raw JSON payload is not rendered in the bubble (the blocks
    // live in the Allow/Deny confirmation card, not here).
    expect(container.textContent).not.toContain(jsonContent);
    // And there is no insert button — insertion only happens via the card.
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
  });

  it("should show a theme-integrated badge when content is blocks JSON without preamble prose", () => {
    const jsonContent = JSON.stringify({ blocks: { blocks: [] } });
    render(
      <ChatMessage
        message={{ role: "assistant", content: jsonContent }}
      />
    );
    const hint = screen.getByText(/blocks are ready/i);
    expect(hint).toBeInTheDocument();
    // The hint is now a small, theme-integrated badge (icon + info accent)
    // rather than a plain muted line.
    expect(hint.querySelector("span").textContent).toBe("🧩");
    expect(hint.className).toContain("text-info-emphasis");
    // It is inline (not a full-width block) so it reads as a compact chip.
    expect(hint.className).toContain("d-inline-flex");
  });

  it("should not show the raw JSON text when content is valid blocks JSON", () => {
    const jsonContent = JSON.stringify({
      blocks: { blocks: [{ id: "block_0", type: "event_onprojectstart" }] },
    });
    const { container } = render(
      <ChatMessage
        message={{ role: "assistant", content: jsonContent }}
      />
    );
    // The raw JSON should not be rendered as text.
    expect(container.textContent).not.toContain(jsonContent);
  });

  it("should flag malformed block JSON content", () => {
    render(
      <ChatMessage
        message={{
          role: "assistant",
          content: "```json\n{\"foo\": \"bar\"}\n```",
        }}
      />
    );
    expect(
      screen.getByText(/malformed block JSON/i)
    ).toBeInTheDocument();
  });

  it("should not show the Insert button when content is not valid JSON", () => {
    render(
      <ChatMessage
        message={{ role: "assistant", content: "just plain text, no json" }}
      />
    );
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
  });

  it("should show an error message when content is a closed fence that is not valid JSON", () => {
    render(
      <ChatMessage
        message={{ role: "assistant", content: "```json\not json at all\n```" }}
      />
    );
    expect(
      screen.getByText("The AI returned malformed block JSON. Please try again.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
  });

  it("should show plain text content when content is not blocks JSON", () => {
    const { container } = render(
      <ChatMessage
        message={{ role: "assistant", content: "just plain text, no json" }}
      />
    );
    // Content is rendered as markdown (wrapped in a <p>), not raw text.
    const contentEl = container.querySelector(".ai-chat-content");
    expect(contentEl.textContent).toContain("just plain text, no json");
    expect(contentEl.querySelector("p")).not.toBeNull();
  });

  it("should render assistant content as markdown", () => {
    const { container } = render(
      <ChatMessage
        message={{
          role: "assistant",
          content: "Here is a **bold** result",
        }}
      />
    );
    const contentEl = container.querySelector(".ai-chat-content");
    expect(contentEl.querySelector("strong")).not.toBeNull();
    expect(contentEl.textContent).toContain("bold");
  });

  it("should render GFM tables in assistant content", () => {
    const { container } = render(
      <ChatMessage
        message={{
          role: "assistant",
          content:
            "| Column | Type |\n|--------|------|\n| species | text |\n| year | number |",
        }}
      />
    );
    const contentEl = container.querySelector(".ai-chat-content");
    const table = contentEl.querySelector("table");
    expect(table).not.toBeNull();
    expect(contentEl.querySelectorAll("thead th").length).toBe(2);
    expect(contentEl.querySelectorAll("tbody td").length).toBe(4);
    expect(table.textContent).toContain("species");
    expect(table.textContent).toContain("number");
  });

  it("should render GFM tables in reasoning content", () => {
    const { container } = render(
      <ChatMessage
        message={{
          role: "assistant",
          content: "answer",
          reasoning:
            "Columns I plan to use:\n| c | t |\n|---|---|\n| a | x |",
        }}
      />
    );
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("should not show the Insert button when content is a JSON object without a blocks key", () => {
    // An object that parses but has no "blocks" key is not a valid blocks payload.
    render(
      <ChatMessage
        message={{ role: "assistant", content: JSON.stringify({ foo: "bar" }) }}
      />
    );
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
  });

  it("should not show the Insert button when content is a JSON primitive", () => {
    // A JSON string parses to a string (not an object), so no Insert button.
    render(
      <ChatMessage
        message={{ role: "assistant", content: "\"just a string\"" }}
      />
    );
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
  });

  it("should not show the Insert button for user messages even if content is blocks JSON", () => {
    const jsonContent = JSON.stringify({ blocks: { blocks: [] } });
    render(
      <ChatMessage
        message={{ role: "user", content: jsonContent }}
      />
    );
    expect(screen.queryByText("Insert into Workspace")).toBeNull();
  });

  it("should render completed tool events with their outcomes in a transcript message", () => {
    // Both tool calls show up with a human-readable summary.
    // (The tool name is split from the "🔧" icon into a separate element,
    // so match on a text node.)
    const { container } = render(
      <ChatMessage
        message={{
          role: "assistant",
          content: undefined,
          reasoning: "let me add the column first",
          tool_events: [
            {
              id: "e1",
              name: "addDataColumn",
              args: { column_name: "total" },
              status: "done",
              description: "add a column named `total` to the data table",
              result: "{\"success\":true}",
              confirmed: true,
            },
            {
              id: "e2",
              name: "insertCode",
              args: { code: { blocks: { blocks: [] } } },
              status: "done",
              description: "insert the code shown in the preview",
              result: "The user declined this action.",
              confirmed: false,
            },
          ],
        }}
      />
    );
    expect(container.textContent).toContain("addDataColumn");
    expect(container.textContent).toContain("insertCode");
    expect(
      screen.getByText("add a column named `total` to the data table")
    ).toBeInTheDocument();
    expect(screen.getByText("✓ done")).toBeInTheDocument();
    expect(screen.getByText("✗ declined by user")).toBeInTheDocument();
    // The reasoning that led to the tool calls is preserved (collapsed).
    expect(screen.getByRole("button", { name: /reasoning/i })).toBeInTheDocument();
  });

  it("should show an error outcome for a failed tool event", () => {
    render(
      <ChatMessage
        message={{
          role: "assistant",
          tool_events: [
            {
              id: "e3",
              name: "addDataColumn",
              args: { column_name: "X" },
              status: "done",
              result: null,
              error: "A column named X already exists.",
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText("✗ A column named X already exists.")
    ).toBeInTheDocument();
  });
});
