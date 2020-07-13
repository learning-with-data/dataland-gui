import React from "react";
import { act } from "react-dom/test-utils";

import { Provider } from "react-redux";

import createUsualStore from "../utils/StoreUtil";
import { mount } from "enzyme";

import {
  GUI_PROJECT_MODIFIED,
  GUI_PROJECT_SAVED,
} from "../../src/redux/actionsTypes";

import SaveStatusComponent from "../../src/components/SaveStatusComponent";

describe("SaveStatusComponent", () => {
  it("should show nothing when initialized", () => {
    const store = createUsualStore();
    const wrapper = mount(<SaveStatusComponent/>, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: store },
    });

    expect(wrapper.find("svg").length).toBe(0);
  });

  it("should change to orange when code has been updated, and then back to green on save", async () => {
    const store = createUsualStore();
    const wrapper = mount(<SaveStatusComponent/>, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: store },
    });

    expect(wrapper.find("svg").length).toBe(0);

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });
    wrapper.update();
    expect(wrapper.find("svg[fill='darkorange']").length).toBe(1);

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_SAVED });
    });
    wrapper.update();
    expect(wrapper.find("svg[fill='darkseagreen']").length).toBe(1);
  });

  it("should show a popover on over", async () => {
    const store = createUsualStore();
    const wrapper = mount(<SaveStatusComponent/>, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: store },
    });

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });
    wrapper.update();

    expect(wrapper.find(".popover-body").length).toBe(0);

    await act(async () => {
      wrapper.find("svg").simulate("mouseover");
    });

    wrapper.update();
    expect(wrapper.find(".popover-body").length).toBe(1);
  });

  it("popover should mention saved or not-saved", async () => {
    const store = createUsualStore();
    const wrapper = mount(<SaveStatusComponent/>, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: store },
    });

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });
    wrapper.update();

    await act(async () => {
      wrapper.find("svg").simulate("mouseover");
    });
    wrapper.update();

    expect(wrapper.find(".popover-body").text()).toMatch(
      /^There are unsaved changes/
    );

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_SAVED });
    });
    wrapper.update();

    expect(wrapper.find(".popover-body").text()).toMatch(
      /^All changes have been saved/
    );
  });
});
