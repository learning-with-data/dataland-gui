import React from "react";
import { act } from "react-dom/test-utils";
import PropTypes from "prop-types";

import { mount } from "enzyme";

import fs from "fs";
import Papa from "papaparse";

import { Provider } from "react-redux";
import createUsualStore from "../utils/StoreUtil";

import Runtime from "../../src/lib/Runtime";
import { RuntimeContext } from "../../src/components/connectToRuntime";

import TableViewerComponent from "../../src/components/TableViewerComponent";

function WrappingProvider(props) {
  const { children, store, runtime } = props;
  return (
    <Provider store={store}>
      <RuntimeContext.Provider value={runtime}>
        {children}
      </RuntimeContext.Provider>
    </Provider>
  );
}

WrappingProvider.propTypes = {
  children: PropTypes.node,
  store: PropTypes.object,
  runtime: PropTypes.object,
};

describe("TableViewerComponent", () => {
  it("should render with a placeholder if there is no data", () => {
    const store = createUsualStore();
    const runtime = new Runtime();
    const wrapper = mount(<TableViewerComponent />, {
      wrappingComponent: WrappingProvider,
      wrappingComponentProps: { runtime, store },
    });

    expect(wrapper.find(".data-placeholder").length).toBe(1);
  });

  it("should render a table with a row # column when data is imported", async () => {
    const csvdata = fs.readFileSync("test/fixtures/sample1.csv", {
      encoding: "utf8",
    });
    const csvParseResults = Papa.parse(csvdata, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });

    const store = createUsualStore();
    const runtime = new Runtime();
    const wrapper = mount(<TableViewerComponent />, {
      wrappingComponent: WrappingProvider,
      wrappingComponentProps: { runtime, store },
    });
    expect(wrapper.find(".data-placeholder").length).toBe(1);

    await act(async () => {
      runtime.setDataTable(csvParseResults.data);
    });
    wrapper.update();
    expect(wrapper.find(".data-placeholder").length).toBe(0);
    expect(wrapper.find("table.data-table").length).toBe(1);
    expect(wrapper.find("th").first().text()).toBe("Row #");
    expect(wrapper.find("td").first().text()).toBe("1");
  });

  it("should allow adding a new column and show the column name", async () => {
    const csvdata = fs.readFileSync("test/fixtures/sample1.csv", {
      encoding: "utf8",
    });
    const csvParseResults = Papa.parse(csvdata, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });

    const store = createUsualStore();
    const runtime = new Runtime();
    const wrapper = mount(<TableViewerComponent />, {
      wrappingComponent: WrappingProvider,
      wrappingComponentProps: { runtime, store },
    });
    expect(wrapper.find(".data-placeholder").length).toBe(1);

    await act(async () => {
      runtime.setDataTable(csvParseResults.data);
    });
    wrapper.update();

    await act(async () => {
      runtime.addColumn("testcol");
    });
    wrapper.update();
    expect(wrapper.find("th[data-column='testcol']").text()).toBe("testcol");
  });
});
