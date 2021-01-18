module.exports = {
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
    "\\.(gif|png|ttf|eot|svg)$": "<rootDir>/test/mocks/fileMocks.js",
  },
  snapshotSerializers: ["enzyme-to-json/serializer"],
  setupFilesAfterEnv: ["<rootDir>/test/utils/setupEnzymeTests.js", "<rootDir>/test/utils/setupSvgSupport.js"],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "jest-coverage",
};
