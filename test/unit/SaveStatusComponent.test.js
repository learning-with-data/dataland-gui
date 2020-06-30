import React from "react";
import { act } from "react-dom/test-utils";

import createUsualStore from "../utils/StoreUtil";
import shallowWrapper from "../utils/shallowWrapper";
import { mount } from "enzyme";

import { PROJECT_CODE_UPDATED } from "../../src/redux/actionsTypes";

import SaveStatusComponent from "../../src/components/SaveStatusComponent";

describe("SaveStatusComponent", () => {
  it("should render without throwing an error", () => {
    const store = createUsualStore();
    expect(
      shallowWrapper(<SaveStatusComponent store={store} />).exists(
        ".savestatus-container"
      )
    ).toBe(true);
  });

  it("should show green circle (i.e., saved) when initialized", () => {
    const store = createUsualStore();

    expect(
      shallowWrapper(
        <SaveStatusComponent
          store={store}
          lastSaveTimestamp={0}
          lastSaveRequestTimeStamp={0}
        />
      ).find("svg[fill='darkseagreen']").length
    ).toBe(1);
  });

  it("should change to orange when code has been updated, and then back to green on save", async () => {
    // See discussion at https://github.com/enzymejs/enzyme/issues/2153#issuecomment-499219572

    const store = createUsualStore();
    const wrap = mount(
      <SaveStatusComponent
        store={store}
        lastSaveTimestamp={0}
        lastSaveRequestTimeStamp={0}
      />
    );

    expect(wrap.find("svg[fill='darkseagreen']").length).toBe(1);

    await act(async () => {
      store.dispatch({ type: PROJECT_CODE_UPDATED });
    });
    wrap.update();
    expect(wrap.find("svg[fill='darkorange']").length).toBe(1);

    wrap.setProps({ lastSaveTimestamp: Date.now() });
    wrap.update();
    expect(wrap.find("svg[fill='darkseagreen']").length).toBe(1);
  });

  it("should show a popover on over", async () => {
    const store = createUsualStore();
    const wrap = mount(
      <SaveStatusComponent
        store={store}
        lastSaveTimestamp={0}
        lastSaveRequestTimeStamp={0}
      />
    );

    expect(wrap.find(".popover-body").length).toBe(0);

    await act(async () => {
      wrap.find("svg").simulate("mouseover");
    });

    wrap.update();
    expect(wrap.find(".popover-body").length).toBe(1);
  });

  it("popover should mention saved or not-saved", async () => {
    const store = createUsualStore();
    const wrap = mount(
      <SaveStatusComponent
        store={store}
        lastSaveTimestamp={0}
        lastSaveRequestTimeStamp={0}
      />
    );

    await act(async () => {
      wrap.find("svg").simulate("mouseover");
    });
    wrap.update();
    expect(wrap.find(".popover-body").text()).toMatch(/^All changes have been saved/);
    await act(async () => {
      store.dispatch({ type: PROJECT_CODE_UPDATED });
    });
    wrap.update();
    expect(wrap.find(".popover-body").text()).toMatch(/^There are unsaved changes/);
    wrap.setProps({ lastSaveTimestamp: Date.now() });
    wrap.update();
    expect(wrap.find(".popover-body").text()).toMatch(/^All changes have been saved/);
  });
});
