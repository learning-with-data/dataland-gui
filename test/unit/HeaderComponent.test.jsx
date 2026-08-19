import React from "react";
import { vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";

import createUsualStore from "../utils/StoreUtil";
import HeaderComponent from "../../src/components/HeaderComponent";

// HeaderComponent reads the AI feature flag (import.meta.env.VITE_AI_ENABLED)
// at module load, so the "enabled" cases re-import the module (with the
// module cache reset) after stubbing the env var, mirroring the pattern in
// AIAgentMaxTurns.test.js and AIServiceVision.test.js.

const renderHeader = (onToggleAiHelper = vi.fn()) => {
  return render(
    <Provider store={createUsualStore()}>
      <HeaderComponent
        initialProjectTitle="Test"
        onToggleAiHelper={onToggleAiHelper}
      >
        <span>children</span>
      </HeaderComponent>
    </Provider>
  );
};

const importHeaderEnabled = async () => {
  vi.stubEnv("VITE_AI_ENABLED", "true");
  vi.resetModules();
  const mod = await import("../../src/components/HeaderComponent");
  return mod.default;
};

describe("HeaderComponent", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when the AI feature is disabled (the default)", () => {
    it("does not render the AI Helper button", () => {
      renderHeader();

      expect(screen.queryByText("AI Helper")).not.toBeInTheDocument();
      expect(document.querySelector(".ai-helper-button")).toBeNull();
    });

    it("still renders the project title input and its children", () => {
      renderHeader();

      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByText("children")).toBeInTheDocument();
    });
  });

  describe("when the AI feature is enabled", () => {
    let EnabledHeader;
    let onToggle;

    beforeAll(async () => {
      EnabledHeader = await importHeaderEnabled();
    });

    beforeEach(() => {
      onToggle = vi.fn();
    });

    afterAll(() => {
      vi.unstubAllEnvs();
    });

    it("renders the AI Helper button as the leftmost element", () => {
      render(
        <Provider store={createUsualStore()}>
          <EnabledHeader
            initialProjectTitle="Test"
            onToggleAiHelper={onToggle}
          >
            <span>children</span>
          </EnabledHeader>
        </Provider>
      );

      const button = screen.getByText("AI Helper");
      expect(button).toBeInTheDocument();

      // The AI Helper button should be the first element inside the header.
      const header = document.querySelector("header");
      const firstChild = header.firstElementChild;
      expect(firstChild).toContainElement(button);
    });

    it("calls onToggleAiHelper when the AI Helper button is clicked", () => {
      render(
        <Provider store={createUsualStore()}>
          <EnabledHeader
            initialProjectTitle="Test"
            onToggleAiHelper={onToggle}
          >
            <span>children</span>
          </EnabledHeader>
        </Provider>
      );

      fireEvent.click(screen.getByText("AI Helper"));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});
