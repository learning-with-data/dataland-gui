import { describe, it, expect, vi, afterEach } from "vitest";
import { Interpreter } from "dataland-interpreter";
import { parseString } from "xml2js";

import DataTable from "../../src/lib/DataTable";
import PrimTable from "../../src/lib/primitives";

import filterXml from "../fixtures/data-filter-math-number.xml?raw";

// A minimal test double: it only implements the subset of the Runtime API the
// data primitives use (getDataTable + dispatchDataUpdate). It captures the
// filter actually pushed so the test can assert on it.
class FakeRuntime {
  constructor(data) {
    this._data = new DataTable(data);
    this.pushedFilters = [];
  }

  getDataTable() {
    return this._data;
  }

  dispatchDataUpdate() {
    // no-op in tests
  }

  captureLastFilter() {
    return this.pushedFilters[this.pushedFilters.length - 1];
  }
}

// Wrap the real PrimTable so we can observe the filter the data_filter
// primitive hands to pushFilter, without altering any behavior.
function makeInstrumentedPrimTable(runtime) {
  const prim = PrimTable(runtime);
  const origPushFilter = runtime.getDataTable().pushFilter.bind(runtime.getDataTable());
  runtime.getDataTable().pushFilter = (filter) => {
    runtime.pushedFilters.push(filter);
    return origPushFilter(filter);
  };
  return prim;
}

function parseXmlAsync(code) {
  return new Promise((resolve, reject) => {
    parseString(code, { explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function runFilterProgram(xml, data) {
  const runtime = new FakeRuntime(data);
  const prim = makeInstrumentedPrimTable(runtime);
  const parsed = await parseXmlAsync(xml);
  const i = new Interpreter(parsed.xml, prim, () => {});
  i.start("project-started");
  // The interpreter ticks every 100 ms; give it a couple of ticks to run the
  // hat -> data_filter chain, then stop it.
  await new Promise((r) => setTimeout(r, 250));
  i.stop();
  return { runtime, data: runtime.getDataTable() };
}

describe("data_filter with a real math_number value block", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("evaluates the math_number MATCH into a real number (not undefined)", async () => {
    const data = [
      { "ZIP Code": "98103", Name: "A" },
      { "ZIP Code": "98101", Name: "B" },
    ];
    const { runtime } = await runFilterProgram(filterXml, data);

    const filter = runtime.captureLastFilter();
    expect(filter).toBeDefined();
    const [col, op, testval] = filter[0];
    expect(col).toBe("ZIP Code");
    expect(op).toBe("eq");
    // Regression: before the math_number primitive existed, the interpreter's
    // real-value path had no primitive for math_number and getBlockArg
    // returned undefined, so this was undefined and only blank rows matched.
    expect(testval).not.toBeUndefined();
    expect(testval).toBe(98103);
  });

  it("keeps only the rows whose ZIP Code equals 98103 (drops blank rows)", async () => {
    const data = [
      { "ZIP Code": "98103", Name: "A" },
      { "ZIP Code": "", Name: "B" },
      { "ZIP Code": "98101", Name: "C" },
      { "ZIP Code": "98103", Name: "D" },
    ];
    const { data: table } = await runFilterProgram(filterXml, data);

    const rows = table.getCurrentData();
    // Before the fix, testval was undefined and `row["ZIP Code"] == undefined`
    // was true for the blank row but false for every populated row, so the
    // filter kept ONLY the blank row. Now it keeps exactly the two 98103 rows.
    expect(rows).toHaveLength(2);
    rows.forEach((row) => {
      expect(row["ZIP Code"]).toBe("98103");
    });
  });

  it("matches a numeric-string column against a numeric math_number value", async () => {
    // The user's data: ZIP codes stored as numeric strings in a "text" column,
    // compared against a real math_number block holding 98103. Both sides look
    // numeric, so pushFilter compares numerically and every 98103 row matches.
    const data = [
      { "ZIP Code": "98103", Name: "A" },
      { "ZIP Code": "98103", Name: "B" },
      { "ZIP Code": "98104", Name: "C" },
    ];
    const { data: table } = await runFilterProgram(filterXml, data);

    const rows = table.getCurrentData();
    expect(rows).toHaveLength(2);
    rows.forEach((row) => {
      expect(row["ZIP Code"]).toBe("98103");
    });
  });

  it("still returns text values for a real text block (type-agnostic)", async () => {
    // A real <block type="text"> value must evaluate to its field text, not
    // undefined. Reuses the same code path as math_number.
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_onprojectstart" id="hat_start" x="10" y="10">
    <next>
      <block type="data_filter" id="block_txt">
        <mutation hasAdditionalCondition="false"></mutation>
        <field name="COLUMN0">Name</field>
        <field name="COMPARISON_OPERATOR0">eq</field>
        <value name="MATCH0">
          <block type="text" id="block_txt_a">
            <field name="TEXT">cat</field>
          </block>
        </value>
      </block>
    </next>
  </block>
</xml>`;
    const data = [
      { Name: "cat", ZIP: 1 },
      { Name: "dog", ZIP: 2 },
    ];
    const runtime = new FakeRuntime(data);
    const prim = makeInstrumentedPrimTable(runtime);
    const parsed = await parseXmlAsync(xml);
    const i = new Interpreter(parsed.xml, prim, () => {});
    i.start("project-started");
    await new Promise((r) => setTimeout(r, 250));
    i.stop();

    const filter = runtime.captureLastFilter();
    expect(filter[0][2]).toBe("cat");
    expect(runtime.getDataTable().getCurrentData()).toHaveLength(1);
  });
});
