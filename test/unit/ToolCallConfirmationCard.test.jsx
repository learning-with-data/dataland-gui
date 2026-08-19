import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { BlockPreviewRenderer } from "../../src/services/ai/BlockPreviewRenderer";
import ToolCallConfirmationCard from "../../src/components/AIChat/ToolCallConfirmationCard";

// Mock the block preview renderer so no Blockly workspace is created.
vi.mock("../../src/services/ai/BlockPreviewRenderer", async () => {
  const actual = await import("../../src/services/ai/BlockPreviewRenderer");
  return {
    ...actual,
    BlockPreviewRenderer: {
      renderPreview: vi.fn().mockResolvedValue("data:image/svg+xml,fake"),
    },
  };
});

const makeEvent = (overrides = {}) => ({
  id: "call_1",
  name: "addDataColumn",
  args: { column_name: "total" },
  status: "pending_confirmation",
  description: "add a column named `total` to the data table",
  result: null,
  ...overrides,
});

describe("ToolCallConfirmationCard", () => {
  it("should render the description and Allow/Deny buttons", () => {
    const onDecision = vi.fn();
    render(
      <ToolCallConfirmationCard
        event={makeEvent()}
        projectDataColumns={["X"]}
        onDecision={onDecision}
      />
    );

    expect(screen.getByText("AI agent wants to:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("add a column named `total` to the data table")).toBeInTheDocument();
    expect(screen.getByTestId("tool-confirm-allow")).toBeInTheDocument();
    expect(screen.getByTestId("tool-confirm-deny")).toBeInTheDocument();
  });

  it("should call onDecision(true) when Allow is clicked", () => {
    const onDecision = vi.fn();
    render(
      <ToolCallConfirmationCard
        event={makeEvent()}
        projectDataColumns={["X"]}
        onDecision={onDecision}
      />
    );

    fireEvent.click(screen.getByTestId("tool-confirm-allow"));
    expect(onDecision).toHaveBeenCalledWith(true);
  });

  it("should call onDecision(false) when Deny is clicked", () => {
    const onDecision = vi.fn();
    render(
      <ToolCallConfirmationCard
        event={makeEvent()}
        projectDataColumns={["X"]}
        onDecision={onDecision}
      />
    );

    fireEvent.click(screen.getByTestId("tool-confirm-deny"));
    expect(onDecision).toHaveBeenCalledWith(false);
  });

  it("should render a block preview for insertCode events", async () => {
    const onDecision = vi.fn();
    render(
      <ToolCallConfirmationCard
        event={makeEvent({
          name: "insertCode",
          args: { code: { blocks: { blocks: [] } } },
          description: "insert blocks into the editor",
        })}
        projectDataColumns={["X"]}
        onDecision={onDecision}
      />
    );

    // renderPreview should have been called with the code and columns.
    expect(BlockPreviewRenderer.renderPreview).toHaveBeenCalled();
    const [json, columns] = BlockPreviewRenderer.renderPreview.mock.calls[0];
    expect(json).toEqual({ blocks: { blocks: [] } });
    expect(JSON.parse(columns)).toEqual(["X"]);

    // The preview image should render.
    const img = await screen.findByAltText("Proposed blocks preview");
    expect(img).toBeInTheDocument();
    expect(img.src).toBe("data:image/svg+xml,fake");
  });

  it("should not render a preview for non-insertCode events", () => {
    vi.clearAllMocks();
    render(
      <ToolCallConfirmationCard
        event={makeEvent()}
        projectDataColumns={["X"]}
        onDecision={vi.fn()}
      />
    );
    expect(BlockPreviewRenderer.renderPreview).not.toHaveBeenCalled();
  });
});
