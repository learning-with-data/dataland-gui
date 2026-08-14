import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import cypressPlugin from "eslint-plugin-cypress";
import babelParser from "@babel/eslint-parser";
import { fixupPluginRules } from "@eslint/compat";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "reports/**", ".nyc_output/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    plugins: {
      react: fixupPluginRules(reactPlugin),
      cypress: fixupPluginRules(cypressPlugin),
    },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          plugins: [
            ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
          ],
        },
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 11,
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        cy: "readonly",
        Cypress: "readonly",
        vi: "readonly",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...cypressPlugin.configs.recommended.rules,
      indent: ["error", 2, { SwitchCase: 1 }],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
    },
  },
];
