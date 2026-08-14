import { describe, it, expect } from "vitest";
import { createProjectBlob, loadProjectBlob } from "../../src/lib/projectio";

import sampleBlob from "../fixtures/sample1.dbp?arraybuffer";

describe("projectio", async () => {
  it("should load a real project blob", () => {
    const [code, data] = loadProjectBlob(sampleBlob);
    expect(typeof code).toBe("string");
    expect(data).toBeDefined();
  });

  it("should perform a round-trip with extracted data", () => {
    const [originalCode, originalData] = loadProjectBlob(sampleBlob);
    const newBlob = createProjectBlob(originalCode, originalData);
    const [recoveredCode, recoveredData] = loadProjectBlob(newBlob);

    expect(recoveredCode).toBe(originalCode);
    expect(recoveredData).toEqual(originalData);
  });

  it("should perform a round-trip with empty state", () => {
    const code = "";
    const data = {};
    const blob = createProjectBlob(code, data);
    const [recoveredCode, recoveredData] = loadProjectBlob(blob);

    expect(recoveredCode).toBe(code);
    expect(recoveredData).toEqual(data);
  });

  it("should throw an error when loading a malformed blob", () => {
    const malformed = new Uint8Array([1, 2, 3, 4, 5]);
    expect(() => loadProjectBlob(malformed)).toThrow();
  });
});
