module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/**/__tests__/**/*.js',
    '<rootDir>/**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!tests/**',
    '!jest.config.js',
    '!server.js',
    '!uploads/**',
    '!logs/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true
};