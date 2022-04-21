import React from "react";
import { act } from "react-dom/test-utils";

import { mount } from "enzyme";

import fs from "fs";
import Papa from "papaparse";

import createUsualStore from "../utils/StoreUtil";
import WrappingProvider from "../utils/WrappingProvider";


import Runtime from "../../src/lib/Runtime";

import TableViewerComponent from "../../src/components/TableViewerComponent";


// https://github.com/Autodesk/react-base-table/issues/189
jest.mock("react-base-table/lib/AutoResizer", () => {
  return jest.fn(({ children }) => children({ width: 1000, height: 400 }));
});

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
    expect(wrapper.find("div.data-table").length).toBe(1);
    expect(
      wrapper.find("div.data-table-header").childAt(0).text()
    ).toBe("Row #");
    expect(wrapper.find("div.BaseTable__row").first().childAt(0).text()).toBe(
      "1"
    );
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
    expect(wrapper.find("div.data-table-header").children().last().text()).toBe("testcol");
  });
});
