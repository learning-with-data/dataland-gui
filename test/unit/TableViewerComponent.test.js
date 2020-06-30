import React from "react";
import { act } from "react-dom/test-utils";

import {mount} from "enzyme";

import fs from "fs";
import Papa from "papaparse";

import createUsualStore from "../utils/StoreUtil";
import shallowWrapper from "../utils/shallowWrapper";

import { PROJECT_DATA_IMPORTED } from "../../src/redux/actionsTypes";

import TableViewerComponent from "../../src/components/TableViewerComponent";

describe("TableViewerComponent", () => {
  it("should render with a placeholder if there is no data", () => {
    const store = createUsualStore();
    expect(
      shallowWrapper(<TableViewerComponent store={store} />).find(
        ".data-placeholder"
      ).length
    ).toBe(1);
  });

  it("should render a table with a row # column when data is imported", async () => {
    const store = createUsualStore();
    const csvdata = fs.readFileSync("test/fixtures/sample1.csv", {
      encoding: "utf8",
    });
    const csvParseResults = Papa.parse(csvdata, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });

    const wrap = mount(<TableViewerComponent store={store} />);
    expect(wrap.find(".data-placeholder").length).toBe(1);

    await act(async () => {
      store.dispatch({ type: PROJECT_DATA_IMPORTED, payload: csvParseResults });
    });
    wrap.update();
    expect(wrap.find(".data-placeholder").length).toBe(0);
    expect(wrap.find("BootstrapTableContainer").length).toBe(1);
    expect(wrap.find("BootstrapTableContainer").prop("columns")[0].dataField).toBe("Row #");
  });
});
