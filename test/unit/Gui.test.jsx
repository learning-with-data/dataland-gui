import React from "react";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";

import createUsualStore from "../utils/StoreUtil";
import _Gui from "../../src/Gui";

// Gui normally wires its children up through connectToRuntime (which drives a
// live Runtime) and renders heavyweight components (Blockly editor, data
// table, viz, the AI chat panel). None of that is under test here: only the
// feature-flag gating of the AI Helper UI. So we:
//   - mock connectToRuntime to a pass-through (this also removes the live
//     Runtime from the picture, so the test is hermetic), and
//   - mock every child component to a cheap placeholder.
// The *real* HeaderComponent is kept, because it (via src/config.js) is where
// the AI_ENABLED flag actually gates the UI.
vi.mock("../../src/components/connectToRuntime", () => ({
  connectToRuntime: (C) => C,
  // A real context so Gui's `static contextType = RuntimeContext` is valid
  // (Gui never uses the context value in this test, but React validates it).
  RuntimeContext: React.createContext(null),
}));
vi.mock("../../src/components/ControlComponent", () => ({
  default: () => <div data-testid="control" />,
}));
vi.mock("../../src/components/EditorComponent", () => ({
  default: () => <div data-testid="editor" />,
}));
vi.mock("../../src/components/ErrorNotifierComponent", () => ({
  default: () => <div data-testid="errors" />,
}));
vi.mock("../../src/components/MonitorComponent", () => ({
  default: () => <div data-testid="monitor" />,
}));
vi.mock("../../src/components/TableViewerComponent", () => ({
  default: () => <div data-testid="table" />,
}));
vi.mock("../../src/components/VisualizationComponent", () => ({
  default: () => <div data-testid="viz" />,
}));
vi.mock("../../src/components/AIChat/ChatPanel", () => ({
  default: () => <div data-testid="chat-panel" />,
}));

const renderGui = (GuiComponent = _Gui) => {
  return render(
    <Provider store={createUsualStore()}>
      <GuiComponent microworld="plots" backend={false} />
    </Provider>
  );
};

// Importing _Gui evaluates src/config.js, which reads the AI feature flag at
// module load. Stub the flag and reset the module cache so the fresh import
// re-evaluates config with the flag on, mirroring the pattern in
// AIAgentMaxTurns.test.js and AIServiceVision.test.js.
const importGuiEnabled = async () => {
  vi.stubEnv("VITE_AI_ENABLED", "true");
  vi.resetModules();
  const mod = await import("../../src/Gui");
  return mod.default;
};

describe("Gui", () => {
  beforeAll(() => {
    // The real react-bootstrap Offcanvas (mounted only when the AI feature is
    // enabled) queries a media query; jsdom has no matchMedia, so stub it.
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        // @restart/hooks (used by react-bootstrap Offcanvas) relies on the
        // legacy MediaQueryList listener API.
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    cleanup();
  });

  describe("when the AI feature is disabled (the default)", () => {
    it("does not render the AI Helper button or chat panel", () => {
      renderGui();

      expect(screen.queryByText("AI Helper")).not.toBeInTheDocument();
      expect(screen.queryByTestId("chat-panel")).not.toBeInTheDocument();
    });

    it("still renders the rest of the GUI", () => {
      renderGui();

      expect(screen.getByTestId("editor")).toBeInTheDocument();
      expect(screen.getByTestId("table")).toBeInTheDocument();
      expect(screen.getByTestId("viz")).toBeInTheDocument();
      expect(screen.getByTestId("control")).toBeInTheDocument();
    });
  });

  describe("when the AI feature is enabled", () => {
    let EnabledGui;

    beforeAll(async () => {
      EnabledGui = await importGuiEnabled();
    });

    afterAll(() => {
      vi.unstubAllEnvs();
    });

    it("renders the AI Helper button when the feature is enabled", () => {
      renderGui(EnabledGui);

      // The button's presence is what the flag controls (HeaderComponent
      // renders it only when AI_ENABLED). The chat panel itself lives inside
      // the Offcanvas, which is hidden (and unmounted) until the button is
      // clicked, so it is not asserted here.
      expect(screen.getByText("AI Helper")).toBeInTheDocument();
    });
  });
});
