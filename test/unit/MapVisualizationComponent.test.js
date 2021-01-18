import React from "react";

import { mount } from "enzyme";

import MapVisualizationComponent from "../../src/components/MapVisualizationComponent";



describe("MapVisualizationComponent", () => {
  it("should show a zoom-out map when initialized", () => {
    const wrapper = mount(<MapVisualizationComponent spec={{ layer: [] }}/>);

    // https://github.com/enzymejs/enzyme/issues/1233#issuecomment-422837247
    expect(wrapper.render().find("img").prop("src")).toMatch(
      /^https:\/\/(.?).tile.openstreetmap.org\/1\/0\/0.png$/
    );
  });

  it("should show a render a correct map for a given spec", () => {
    const spec = require("../fixtures/mapspec1.json");
    const wrapper = mount(<MapVisualizationComponent spec={spec}/>);

    expect(wrapper.render().find("path[stroke=\"#3333ff\"]")).toHaveLength(3);
  });
});
