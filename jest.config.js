module.exports = {
  collectCoverage: true,
  coverageDirectory: "jest-coverage",
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
    "\\.(gif|png|ttf|eot|svg)$": "<rootDir>/test/mocks/fileMocks.js",
  },
  setupFiles: ["jest-canvas-mock"],
  setupFilesAfterEnv: [
    "<rootDir>/test/utils/setupEnzymeTests.js",
    "<rootDir>/test/utils/setupSvgSupport.js",
  ],
  snapshotSerializers: ["enzyme-to-json/serializer"],
  testEnvironment: "jsdom",
  verbose: true,

};
