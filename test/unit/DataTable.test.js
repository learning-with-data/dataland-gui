import "../../src/lib/DataTable";
import DataTable from "../../src/lib/DataTable";

import csvContent from "../fixtures/chapel-hill-weather-ncei.csv?raw";

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

  it("should group correctly", () => {
    const d = new DataTable(csvParseResults.data);
    d.aggregate("STATION", "mean", "PRCP");
    expect(d.getCurrentData().length).toBe(8);

    expect(d.getCurrentData()[0].STATION).toBe("US1NCOR0038");
    expect(d.getCurrentData()[7].STATION).toBe("USR0000NDUK");
  });

  it("should do aggregation correctly", () => {
    const d = new DataTable(csvParseResults.data);
    d.aggregate("STATION", "mean", "PRCP");

    expect(d.getCurrentData()[0].PRCP).toBeCloseTo(0.16839285714285712);
    expect(d.getCurrentData()[7].PRCP).toBeNaN();
  });

  describe("pushFilter type-aware comparison", () => {
    // These mirror the data_filter primitive's contract: the MATCH value may be
    // a number or a string, and the column may hold numbers or numeric strings.
    // eq/neq compare numerically when BOTH sides are numeric and fall back to
    // string comparison otherwise, so a user doesn't need to know a column's
    // type (the block language is type-agnostic).
    const zips = [{ ZIPCode: 98103, Name: "A" }, { ZIPCode: 98103, Name: "B" }];

    it("should match a numeric column with a numeric string test value (eq, all rows)", () => {
      const d = new DataTable(zips);
      d.pushFilter([["ZIPCode", "eq", "98103"]]);
      // Both rows have ZIPCode 98103 (number), and the test value "98103" is a
      // numeric string. Both sides are numeric, so the comparison is numeric and
      // every row matches.
      expect(d.getCurrentData()).toHaveLength(2);
    });

    it("should match a numeric column with a numeric test value (eq, all rows)", () => {
      const d = new DataTable(zips);
      d.pushFilter([["ZIPCode", "eq", 98103]]);
      // Both sides are numbers; numeric comparison matches every row.
      expect(d.getCurrentData()).toHaveLength(2);
    });

    it("should match a text column of numeric strings with a number test value (eq, all rows)", () => {
      // A column stored as text (e.g. ZIP codes) holding numeric strings must
      // still match a *number* test value: both sides look numeric, so the
      // comparison is numeric. This is the case the old one-directional
      // coercion missed (it only coerced the test value when the *cell* was a
      // number, not the reverse).
      const t = new DataTable([{ N: "98103" }, { N: "98103" }]);
      t.pushFilter([["N", "eq", 98103]]);
      expect(t.getCurrentData()).toHaveLength(2);
    });

    it("should treat a leading-zero string and a number as equal (eq)", () => {
      // "01234" (string, e.g. a US ZIP code) and 1234 (number) are the same
      // value with different formatting. Because both sides look numeric, the
      // comparison is numeric (1234 === 1234) and they match. A string
      // comparison would fail here, which is why numeric comparison is used
      // when both sides are numeric.
      const t = new DataTable([{ ZIP: "01234" }, { ZIP: "01234" }]);
      t.pushFilter([["ZIP", "eq", 1234]]);
      expect(t.getCurrentData()).toHaveLength(2);
    });

    it("should keep string semantics for genuinely text values (eq, all rows)", () => {
      // A non-numeric value must still match by string equality: neither side
      // is numeric, so the comparison is string-based.
      const t = new DataTable([{ N: "cat" }, { N: "cat" }]);
      t.pushFilter([["N", "eq", "cat"]]);
      expect(t.getCurrentData()).toHaveLength(2);
    });

    it("should not match a numeric column when nothing satisfies a numeric string test value (lt, no rows)", () => {
      const d = new DataTable(zips);
      d.pushFilter([["ZIPCode", "lt", "1"]]);
      // gt/lt/gte/lte are numeric operators: nothing in the column is < 1, so
      // no row matches and the table is empty.
      expect(d.getCurrentData()).toHaveLength(0);
    });

    it("should not match a text column with a non-numeric test value (neq, no rows)", () => {
      // neq is the inverse of eq. For a text column, neither side is numeric
      // (test value "cat"), so the comparison is string-based: "cat" != "cat"
      // is false, so no row matches.
      const t = new DataTable([{ N: "cat" }, { N: "cat" }]);
      t.pushFilter([["N", "neq", "cat"]]);
      expect(t.getCurrentData()).toHaveLength(0);
    });

    it("should match a numeric column with a non-numeric test value (neq, all rows)", () => {
      // neq with a numeric column and a non-numeric test value: the cell is
      // numeric but the test value is not, so the comparison is string-based
      // (Number is not applied). 98103 != "cat" is true, so every row matches.
      const d = new DataTable(zips);
      d.pushFilter([["ZIPCode", "neq", "cat"]]);
      expect(d.getCurrentData()).toHaveLength(2);
    });
  });

});
