import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { VegaEmbed } from "react-vega";
import createUsualStore from "../utils/StoreUtil";
import WrappingProvider from "../utils/WrappingProvider";
import Runtime from "../../src/lib/Runtime";
import VisualizationComponent from "../../src/components/VisualizationComponent";

vi.mock("react-vega", () => ({
  VegaEmbed: vi.fn(() => null),
}));

const renderWithProvider = (ui) => {
  return render(
    <WrappingProvider runtime={new Runtime()} store={createUsualStore()}>
      {ui}
    </WrappingProvider>
  );
};

describe("VisualizationComponent", () => {
  afterEach(() => {
    cleanup();
  });

  it("should capture the Vega view from onRender for plots", () => {
    const fakeView = { width: () => 400, toCanvas: vi.fn() };
    VegaEmbed.mockImplementation((props) => {
      // Simulate react-vega reporting the view once the chart has rendered.
      props.onRender({ view: fakeView });
      return null;
    });

    let instance = null;
    renderWithProvider(
      <VisualizationComponent
        microworld="plots"
        projectVisualizationSpec={{ mark: "point" }}
        ref={(c) => {
          instance = c;
        }}
      />
    );

    expect(instance).toBeTruthy();
    // The onRender callback captured the view on the underlying component,
    // which is what getVisualizationImage relies on.
    expect(instance._view).toBe(fakeView);
  });

  it("should render the map visualizer (without a Vega view) for maps", () => {
    let instance = null;
    renderWithProvider(
      <VisualizationComponent
        microworld="maps"
        projectVisualizationSpec={{ layer: [] }}
        ref={(c) => {
          instance = c;
        }}
      />
    );

    expect(instance).toBeTruthy();
    // The map path has no Vega view; the image API reports no chart.
    expect(instance._view).toBeNull();
  });
});
