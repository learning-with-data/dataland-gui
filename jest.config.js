module.exports = {
  moduleNameMapper: {
    "\\.(css|less)$":  "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg)$": "<rootDir>/test/mocks/fileMock.js",
  },
  "snapshotSerializers": [
    "enzyme-to-json/serializer"
  ],
  "setupFilesAfterEnv": ["<rootDir>/test/utils/setupEnzymeTests.js"],
  verbose: true,
};
