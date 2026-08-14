import React from "react";
import { render } from "@testing-library/react";
import MapVisualizationComponent from "../../src/components/MapVisualizationComponent";

describe("MapVisualizationComponent", () => {
  it("should show a zoom-out map when initialized", () => {
    const { container } = render(<MapVisualizationComponent spec={{ layer: [] }}/>);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.src).toMatch(
      /^https:\/\/(.?).tile.openstreetmap.org\/1\/0\/0.png$/
    );
  });

  it("should show a render a correct map for a given spec", () => {
    const spec = require("../fixtures/mapspec1.json");
    const { container } = render(<MapVisualizationComponent spec={spec}/>);
    const paths = container.querySelectorAll("path[stroke=\"#3333ff\"]");
    expect(paths).toHaveLength(3);
  });
});
