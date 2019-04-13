const { defaults } = require('jest-config');

module.exports = {
  verbose: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testPathIgnorePatterns: [
    ...defaults.testPathIgnorePatterns,
    '<rootDir>/node_modules/',
    '<rootDir>/output/'
  ],
  moduleNameMapper: {}
};
