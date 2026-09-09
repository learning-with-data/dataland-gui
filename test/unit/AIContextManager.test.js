import { describe, it, expect } from "vitest";
import { AIContextManager } from "../../src/services/ai/AIContextManager";

describe("AIContextManager", () => {
  describe("summarizeData", () => {
    it("should return 'No data loaded.' when data or columns are missing", () => {
      expect(AIContextManager.summarizeData(null, [])).toBe("No data loaded.");
      expect(AIContextManager.summarizeData([], [])).toBe("No data loaded.");
      expect(AIContextManager.summarizeData([[1, 2]], null)).toBe("No data loaded.");
    });

    it("should correctly summarize data as an array of arrays", () => {
      const columns = ["Name", "Age"];
      const data = [
        ["Alice", 30],
        ["Bob", 25],
        ["Charlie", 35],
        ["David", 40], // Should be sliced out
      ];
      const result = AIContextManager.summarizeData(data, columns);

      expect(result).toContain("Columns: Name, Age");
      expect(result).toContain("Name: Alice, Age: 30");
      expect(result).toContain("Name: Bob, Age: 25");
      expect(result).toContain("Name: Charlie, Age: 35");
      expect(result).not.toContain("Name: David");
    });

    it("should correctly summarize data as an array of objects", () => {
      const columns = ["Name", "Age"];
      const data = [
        { Name: "Alice", Age: 30 },
        { Name: "Bob", Age: 25 },
        { Name: "Charlie", Age: 35 },
      ];
      const result = AIContextManager.summarizeData(data, columns);

      expect(result).toContain("Columns: Name, Age");
      expect(result).toContain("Name: Alice, Age: 30");
      expect(result).toContain("Name: Bob, Age: 25");
      expect(result).toContain("Name: Charlie, Age: 35");
    });

    it("should handle missing values in object rows", () => {
      const columns = ["Name", "Age"];
      const data = [
        { Name: "Alice" }, // Age is missing
        { Age: 25 },       // Name is missing
      ];
      const result = AIContextManager.summarizeData(data, columns);

      expect(result).toContain("Name: Alice, Age: undefined");
      expect(result).toContain("Name: undefined, Age: 25");
    });
  });

  describe("getSystemPrompt", () => {
    it("should include all necessary context in the prompt", () => {
      const microworld = "plots";
      const columns = ["X", "Y"];
      const data = [[1, 2], [3, 4]];

      const prompt = AIContextManager.getSystemPrompt(microworld, data, columns);

      expect(prompt).toContain(`Current Microworld: ${microworld}`);
      expect(prompt).toContain("Dataset Context:");
      expect(prompt).toContain("Columns: X, Y");
      expect(prompt).toContain("X: 1, Y: 2");
      expect(prompt).toContain("### When Generating Code: JSON Serialization Guide");
    });

    it("should list the available tools in the prompt", () => {
      const prompt = AIContextManager.getSystemPrompt("plots", [[1, 2]], ["X", "Y"]);

      expect(prompt).toContain("### Available Tools");
      expect(prompt).toContain("getDataColumns");
      expect(prompt).toContain("readDataTable");
      expect(prompt).toContain("getTableStats");
      expect(prompt).toContain("getCurrentCode");
      expect(prompt).toContain("getCurrentVisualization");
    });

    it("should describe the multi-capability role, not just code generation", () => {
      const prompt = AIContextManager.getSystemPrompt("plots", [[1, 2]], ["X", "Y"]);

      expect(prompt).toContain("Brainstorming");
      expect(prompt).toContain("Answering questions");
      expect(prompt).toContain("Explaining");
    });

    it("should report the total row count of the dataset", () => {
      const prompt = AIContextManager.getSystemPrompt(
        "plots",
        [[1], [2], [3]],
        ["X"]
      );
      expect(prompt).toContain("3 rows in total");
    });

    describe("value-connection guidance (shadow vs. real block)", () => {
      // The interpreter evaluates a real `math_number`/`text` block as a real
      // number/string, but treats a `shadow` only as an editable placeholder
      // that never evaluates. If the prompt ever regresses to telling the model
      // to emit shadows for values, numeric filters stop matching, so these
      // guard the corrected guidance.
      it("should instruct the model to use a real block for value inputs", () => {
        const prompt = AIContextManager.getSystemPrompt(
          "plots",
          [[1, 2]],
          ["X", "Y"]
        );
        expect(prompt).toContain("Value Connections (Real Blocks)");
        expect(prompt).toMatch(/inputs.*INPUT_NAME.*block/);
        expect(prompt).toContain("math_number");
      });

      it("should no longer instruct the model to emit shadow values for every input", () => {
        const prompt = AIContextManager.getSystemPrompt(
          "plots",
          [[1, 2]],
          ["X", "Y"]
        );
        expect(prompt).not.toContain("Value Connections (Shadow Blocks)");
        expect(prompt).not.toContain("for \"text\" or \"math_number\" values");
      });

      it("should include a data_filter example that uses a real math_number block", () => {
        const prompt = AIContextManager.getSystemPrompt(
          "plots",
          [[1, 2]],
          ["X", "Y"]
        );
        expect(prompt).toContain("\"MATCH0\": { \"block\": {");
        expect(prompt).toContain("\"type\": \"math_number\"");
        expect(prompt).toContain("\"NUM\": 25");
      });
    });
  });
});
