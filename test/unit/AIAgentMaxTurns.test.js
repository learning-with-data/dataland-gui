import { describe, it, expect, vi, afterAll } from "vitest";

// AIAgent reads import.meta.env.VITE_AI_MAX_TURNS at module load, so each
// case re-imports the module (with the module cache reset) after stubbing
// the env var, mirroring the pattern in AIServiceVision.test.js.

const importAgent = async (envValue) => {
  vi.unstubAllEnvs();
  if (envValue !== undefined) {
    vi.stubEnv("VITE_AI_MAX_TURNS", envValue);
  }
  vi.resetModules();
  const mod = await import("../../src/services/ai/AIAgent");
  return mod.AIAgent;
};

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("AIAgent.MAX_TURNS env configuration", () => {
  it("defaults to 5 when VITE_AI_MAX_TURNS is unset", async () => {
    const AIAgent = await importAgent(undefined);
    expect(AIAgent.MAX_TURNS).toBe(5);
  });

  it("uses a positive integer value from the env variable", async () => {
    const AIAgent = await importAgent("8");
    expect(AIAgent.MAX_TURNS).toBe(8);
  });

  it("falls back to 5 for invalid values", async () => {
    for (const value of ["", "0", "-3", "abc", "2.5"]) {
      const AIAgent = await importAgent(value);
      expect(AIAgent.MAX_TURNS).toBe(5);
    }
  });
});
