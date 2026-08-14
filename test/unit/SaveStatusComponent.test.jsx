import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import { Provider } from "react-redux";
import createUsualStore from "../utils/StoreUtil";

import {
  GUI_PROJECT_MODIFIED,
  GUI_PROJECT_SAVED,
} from "../../src/redux/actionsTypes";

import SaveStatusComponent from "../../src/components/SaveStatusComponent";

const renderWithProvider = (ui, { store = createUsualStore() } = {}) => {
  return render(
    <Provider store={store}>
      {ui}
    </Provider>
  );
};

describe("SaveStatusComponent", () => {
  it("should show nothing when initialized", () => {
    const { container } = renderWithProvider(<SaveStatusComponent/>);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("should change to orange when code has been updated, and then back to green on save", async () => {
    const store = createUsualStore();
    const { container } = renderWithProvider(<SaveStatusComponent/>, { store });

    expect(container.querySelectorAll("svg")).toHaveLength(0);

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });
    expect(container.querySelector("svg[fill='darkorange']")).not.toBeNull();

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_SAVED });
    });
    expect(container.querySelector("svg[fill='darkseagreen']")).not.toBeNull();
  });

  it("should show a popover on over", async () => {
    const store = createUsualStore();
    const { container } = renderWithProvider(<SaveStatusComponent/>, { store });

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });

    expect(document.body.querySelector(".popover-body")).toBeNull();

    const svg = container.querySelector("svg");
    await act(async () => {
      fireEvent.mouseOver(svg);
    });

    expect(document.body.querySelector(".popover-body")).not.toBeNull();
  });

  it("popover should mention saved or not-saved", async () => {
    const store = createUsualStore();
    const { container } = renderWithProvider(<SaveStatusComponent/>, { store });

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_MODIFIED });
    });

    const svg = container.querySelector("svg");
    await act(async () => {
      fireEvent.mouseOver(svg);
    });

    expect(document.body.querySelector(".popover-body").textContent).toMatch(
      /^There are unsaved changes/
    );

    await act(async () => {
      store.dispatch({ type: GUI_PROJECT_SAVED });
    });

    expect(document.body.querySelector(".popover-body").textContent).toMatch(
      /^All changes have been saved/
    );
  });
});
