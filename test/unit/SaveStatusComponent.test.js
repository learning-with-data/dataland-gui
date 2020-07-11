import React from "react";
import { act } from "react-dom/test-utils";

import createUsualStore from "../utils/StoreUtil";
import shallowWrapper from "../utils/shallowWrapper";
import { mount } from "enzyme";

import {
  GUI_PROJECT_MODIFIED,
  GUI_PROJECT_SAVED,
} from "../../src/redux/actionsTypes";

import SaveStatusComponent from "../../src/components/SaveStatusComponent";

describe("SaveStatusComponent", () => {
  it("should show nothing when initialized", () => {
    const store = createUsualStore();

    expect(
      shallowWrapper(
        <SaveStatusComponent
          store={store}
          lastSaveTimestamp={0}
          lastSaveRequestTimeStamp={0}
        />
      ).find("svg").length
    ).toBe(0);
  });

  it("should change to orange when code has been updated, and then back to green on save", async () => {
    // See discussion at https://github.com/enzymejs/enzyme/issues/2153#issuecomment-499219572

    const store = createUsualStore();
    const wrap = mount(<SaveStatusComponent store={store} />);

    expect(wrap.find("svg").length).toBe(0);

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });
    wrap.update();
    expect(wrap.find("svg[fill='darkorange']").length).toBe(1);

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_SAVED });
    });
    wrap.update();
    expect(wrap.find("svg[fill='darkseagreen']").length).toBe(1);
  });

  it("should show a popover on over", async () => {
    const store = createUsualStore();
    const wrap = mount(
      <SaveStatusComponent
        store={store}
      />
    );

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });
    wrap.update();

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
      />
    );

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });
    wrap.update();

    await act(async () => {
      wrap.find("svg").simulate("mouseover");
    });
    wrap.update();

    expect(wrap.find(".popover-body").text()).toMatch(
      /^There are unsaved changes/
    );

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_SAVED });
    });
    wrap.update();

    expect(wrap.find(".popover-body").text()).toMatch(
      /^All changes have been saved/
    );
  });
});
