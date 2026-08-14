import React from "react";
import { render, act } from "@testing-library/react";
import { vi } from "vitest";

import Papa from "papaparse";

import createUsualStore from "../utils/StoreUtil";
import WrappingProvider from "../utils/WrappingProvider";

import Runtime from "../../src/lib/Runtime";
import TableViewerComponent from "../../src/components/TableViewerComponent";

import csvdata from "../fixtures/sample1.csv?raw";

vi.mock("react-base-table", async () => {
  const actual = await vi.importActual("react-base-table");
  return {
    ...actual,
    AutoResizer: vi.fn(({ children }) => children({ width: 1000, height: 400 })),
  };
});

const renderWithProvider = (ui, { runtime, store = createUsualStore() } = {}) => {
  return render(
    <WrappingProvider runtime={runtime} store={store}>
      {ui}
    </WrappingProvider>
  );
};

describe("TableViewerComponent", () => {
  it("should render with a placeholder if there is no data", () => {
    const store = createUsualStore();
    const runtime = new Runtime();
    const { container } = renderWithProvider(<TableViewerComponent />, { runtime, store });
    expect(container.querySelectorAll(".data-placeholder")).toHaveLength(1);
  });

  it("should render a table with a row # column when data is imported", async () => {
    const csvParseResults = Papa.parse(csvdata, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });

    const store = createUsualStore();
    const runtime = new Runtime();
    const { container } = renderWithProvider(<TableViewerComponent />, { runtime, store });
    expect(container.querySelectorAll(".data-placeholder")).toHaveLength(1);

    await act(async () => {
      runtime.setDataTable(csvParseResults.data);
    });

    expect(container.querySelectorAll(".data-placeholder")).toHaveLength(0);
    expect(container.querySelectorAll("div.data-table")).toHaveLength(1);

    const headerCell = container.querySelector("div.data-table-header > div");
    expect(headerCell.textContent).toBe("Row #");

    const firstRowCell = container.querySelector("div.BaseTable__row > div");
    expect(firstRowCell.textContent).toBe("1");
  });

  it("should allow adding a new column and show the column name", async () => {
    const csvParseResults = Papa.parse(csvdata, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });

    const store = createUsualStore();
    const runtime = new Runtime();
    const { container } = renderWithProvider(<TableViewerComponent />, { runtime, store });
    expect(container.querySelectorAll(".data-placeholder")).toHaveLength(1);

    await act(async () => {
      runtime.setDataTable(csvParseResults.data);
    });

    await act(async () => {
      runtime.addColumn("testcol");
    });

    const headers = container.querySelectorAll("div.data-table-header > div");
    const lastHeader = headers[headers.length - 1];
    expect(lastHeader.textContent).toBe("testcol");
  });
});
