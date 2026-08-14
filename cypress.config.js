const { defineConfig } = require("cypress");
const registerCodeCoverageTasks = require("@cypress/code-coverage/task");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "test/integration/**/*-spec.js",
    supportFile: "test/cypress/support/index.js",
    fixturesFolder: "test/fixtures",
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config);
      return config;
    },
  },
});
