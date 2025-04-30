/** @type {import('jest').Config} */
const config = {
  projects: ['<rootDir>/packages/*/jest.config.js'],
  coverageDirectory: '<rootDir>/build/coverage',
  collectCoverage: true,
  reporters: ['default'],

  testEnvironment: 'jsdom'
};

// eslint-disable-next-line no-undef
module.exports = config;