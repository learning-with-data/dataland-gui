import "../../src/lib/DataTable";
import DataTable from "../../src/lib/DataTable";
import fs from "fs";

import Papa from "papaparse";

const parseConfig = { dynamicTyping: true, header: true, skipEmptyLines: true };

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

describe("DataTable", () => {
  let csvParseResults;
  beforeAll(() => {
    const csvContent = fs.readFileSync(
      "test/fixtures/chapel-hill-weather-ncei.csv",
      "utf-8"
    );
    csvParseResults = Papa.parse(csvContent, parseConfig);
  });

  it("should initialize", () => {
    const d = new DataTable(csvParseResults.data);
    expect(d).toBeInstanceOf(DataTable);
  });

  it("should return correct fields", () => {
    const d = new DataTable(csvParseResults.data);
    expect(d.getCurrentColumns()).toEqual(
      expect.arrayContaining([
        "STATION",
        "NAME",
        "DATE",
        "AWND",
        "PGTM",
        "PRCP",
        "TAVG",
        "TMAX",
        "TMIN",
        "WT01",
      ])
    );
  });

  it("should return back the original data when no filter has been applied", () => {
    const d = new DataTable(csvParseResults.data);
    expect(
      d.getCurrentData().map((row) => {
        delete row.__id;
        delete row.__visible_id;
        delete row.__selected;
        return row;
      })
    ).toStrictEqual(csvParseResults.data);
  });

  it("should return back the original rowcount when no filter has been applied", () => {
    const d = new DataTable(csvParseResults.data);
    expect(d.getCurrentRowCount()).toStrictEqual(csvParseResults.data.length);
  });

  it("should filter with single string equality condition correctly", () => {
    const d = new DataTable(csvParseResults.data);
    const filter = [["NAME", "eq", "CANE CREEK RESERVOIR, NC US"]];
    d.pushFilter(filter);
    d.getCurrentData().forEach((row) => {
      expect(row["NAME"]).toBe("CANE CREEK RESERVOIR, NC US");
    });
  });

  it("should filter with two string equality conditions with OR correctly", () => {
    const d = new DataTable(csvParseResults.data);
    const filter = [
      ["NAME", "eq", "CANE CREEK RESERVOIR, NC US"],
      ["or"],
      ["STATION", "eq", "USW00003758"],
    ];
    d.pushFilter(filter);

    expect(d.getCurrentData()).toHaveLength(1831);
    d.getCurrentData().forEach((row) => {
      expect(
        row["NAME"] == "CANE CREEK RESERVOIR, NC US" ||
          row["NAME"] == "DURHAM 11 W, NC US"
      ).toBeTruthy();
    });
  });

  it("should filter with two string equality conditions with AND correctly", () => {
    const d = new DataTable(csvParseResults.data);
    const filter = [
      ["NAME", "eq", "CANE CREEK RESERVOIR, NC US"],
      ["and"],
      ["STATION", "eq", "USW00003758"],
    ];
    d.pushFilter(filter);
    expect(d.getCurrentData()).toHaveLength(0);
  });

  it("should apply filters twice correctly", () => {
    const d = new DataTable(csvParseResults.data);
    const filter1 = [["NAME", "eq", "CANE CREEK RESERVOIR, NC US"]];
    const filter2 = [["STATION", "eq", "USW00003758"]];
    d.pushFilter(filter1);
    d.pushFilter(filter2);
    expect(d.getCurrentData()).toHaveLength(0);
  });

  it("should pop filters correctly", () => {
    const d = new DataTable(csvParseResults.data);
    const filter1 = [["NAME", "eq", "CANE CREEK RESERVOIR, NC US"]];
    const filter2 = [["STATION", "eq", "USW00003758"]];
    d.pushFilter(filter1);
    d.pushFilter(filter2);
    expect(d.getCurrentData()).toHaveLength(0);
    d.popFilter();
    expect(d.getCurrentData()).toHaveLength(912);
    d.popFilter();
    expect(
      d.getCurrentData().map((row) => {
        delete row.__id;
        delete row.__visible_id;
        delete row.__selected;
        return row;
      })
    ).toStrictEqual(csvParseResults.data);
  });

  it("should select rows correctly", () => {
    // Note for this test and the next:
    // The __visible_id field counts from 1, rather than 0,
    // so the __visible_id of the first row is 1, and so on
    const idx = getRandomInt(1, csvParseResults.data.length);
    const d = new DataTable(csvParseResults.data);
    d.selectRow(idx);
    var row = d.getSelectedRow();
    expect(row.__visible_id).toStrictEqual(idx + 1);

    d.selectNextRow();
    row = d.getSelectedRow();
    expect(row.__visible_id).toStrictEqual(idx + 2);
  });

  it("should not update selection if an index beyond the range is called", () => {
    var idx = csvParseResults.data.length;

    const d = new DataTable(csvParseResults.data);

    d.selectRow(idx);
    var row = d.getSelectedRow();
    expect(row.__visible_id).toStrictEqual(1);

    d.selectNextRow();
    row = d.getSelectedRow();
    expect(row.__visible_id).toStrictEqual(2);

    idx = getRandomInt(
      csvParseResults.data.length,
      csvParseResults.data.length * 2
    );
    d.selectRow(idx);
    row = d.getSelectedRow();
    expect(row.__visible_id).toStrictEqual(2);

    d.selectNextRow();
    row = d.getSelectedRow();
    expect(row.__visible_id).toStrictEqual(3);

    d.selectRow(-20);
    row = d.getSelectedRow();
    expect(row.__visible_id).toStrictEqual(3);
  });

  it("should return correct values from cells", () => {
    const d = new DataTable(csvParseResults.data);
    expect(d.getCellValue("STATION")).toStrictEqual("US1NCOR0038");

    d.selectRow(3);
    expect(d.getCellValue("PRCP")).toStrictEqual(0.1);

    d.selectNextRow();
    expect(d.getCellValue("DATE")).toStrictEqual("2018-01-05");
  });

  it("should add columns correctly", () => {
    const d = new DataTable(csvParseResults.data);
    const filter = [["NAME", "eq", "CANE CREEK RESERVOIR, NC US"]];
    d.pushFilter(filter);
    d.addColumn("NEWCOL");
    d.getCurrentData().forEach((row) => {
      expect(row["NEWCOL"]).toBe("");
    });
    expect(d.getCurrentData()).toHaveLength(912);
    d.popFilter();
    expect(d.getCurrentData()).toHaveLength(5174);
    d.getCurrentData().forEach((row) => {
      expect(row["NEWCOL"]).toBe("");
    });
  });

  it("should set values in columns correctly", () => {
    const d = new DataTable(csvParseResults.data);
    d.addColumn("NEWCOL");
    const filter = [["NAME", "eq", "CANE CREEK RESERVOIR, NC US"]];
    d.pushFilter(filter);
    d.selectRow(3);
    d.setCellValue("NEWCOL", "NEWVAL");

    var modifiedRow = d.getCurrentData().filter((row) => {
      return row["NEWCOL"] === "NEWVAL";
    });
    expect(modifiedRow).toHaveLength(1);
    expect(modifiedRow[0]["DATE"]).toBe("2018-01-04");

    d.popFilter();
    modifiedRow = d.getCurrentData().filter((row) => {
      return row["NEWCOL"] === "NEWVAL";
    });
    expect(modifiedRow).toHaveLength(1);
    expect(modifiedRow[0]["DATE"]).toBe("2018-01-04");
  });
});
