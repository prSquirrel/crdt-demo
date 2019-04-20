const { defaults } = require('jest-config');

module.exports = {
  verbose: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    ...defaults.testPathIgnorePatterns,
    '<rootDir>/node_modules/',
    '<rootDir>/output/'
  ],
  moduleNameMapper: {}
  // "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
};
