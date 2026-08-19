import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import arraybuffer from "vite-plugin-arraybuffer";
import istanbul from "vite-plugin-istanbul";
import path from "path";

// Simple plugin to mimic ifdef-loader behavior
const ifdefPlugin = () => {
  return {
    name: "vite-plugin-ifdef",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".js") && !id.endsWith(".jsx")) return null;

      const isDebug = process.env.NODE_ENV === "development";

      // Matches blocks between /// #if DEBUG and /// #endif
      const regex = /\/\/\/\s*#if\s+DEBUG([\s\S]*?)\/\/\/\s*#endif/g;

      const newCode = !isDebug
        ? code.replace(regex, "")
        : code.replace(/\/\/\/\s*#if\s+DEBUG|\/\/\/\s*#endif/g, "");

      return {
        code: newCode,
        map: null,
      };
    },
  };
};

export default defineConfig(() => {
  const isLib = process.env.BUILD_TARGET === "component";

  return {
    plugins: [
      react(),
      nodePolyfills(),
      ifdefPlugin(),
      istanbul({
        include: "src/*",
        exclude: ["node_modules", "test/"],
        extension: [".js", ".jsx"],
        requireEnv: true,
      }),
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/blockly/media/*",
            dest: "blocks-media",
          },
        ],
      }),
      arraybuffer()
    ],
    resolve: {
      alias: {
        // If there are any specific aliases from webpack, they would go here
      },
    },
    build: {
      outDir: "dist",
      sourcemap: !isLib,
      minify: isLib ? "terser" : "esbuild",
      lib: isLib
        ? {
          entry: path.resolve(import.meta.dirname, "src/index.jsx"),
          name: "DataLandGui",
          fileName: "main",
          formats: ["umd"],
        }
        : undefined,
      rollupOptions: {
        input: isLib
          ? undefined
          : {
            main: path.resolve(import.meta.dirname, "example/example.html"),
            multi: path.resolve(
              import.meta.dirname,
              "example/multi-example.html",
            ),
          },
        external: isLib ? ["react", "react-dom", "redux", "react-redux"] : [],
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./test/setupTests.js"],
      // Deterministic baseline for import.meta.env in unit tests. These
      // values override whatever a local .env file defines, so tests are
      // hermetic (e.g. a developer's .env with VITE_AI_VISION=true does not
      // flip the module-level vision gate in AIService/ToolRegistry, and
      // VITE_AI_ENABLED defaults to off, so the AI Helper UI is hidden
      // unless a test opts in). Tests that need a different value use
      // vi.stubEnv + vi.resetModules + a dynamic import (see
      // AIServiceVision.test.js and AIAgentMaxTurns.test.js).
      env: {
        VITE_AI_ENABLED: "",
        VITE_AI_VISION: "",
        VITE_AI_MAX_TURNS: "",
        // The dev server (npm start) sets DEV=true; vitest sets DEV=false.
        // We enable it here so the dev-only token-usage path in
        // AIService/AIAgent is exercised by the unit tests.
        VITE_DEV: "true",
      },
      coverage: {
        provider: "istanbul",
        reporter: ["json", "text", "html"],
      },
    },
  };
});
