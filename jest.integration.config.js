module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/backend/src'],
  testMatch: ['**/__tests__/**/*.integration.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
  },
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    '!backend/src/**/*.d.ts',
    '!backend/src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/backend/src/__tests__/setup/integration.setup.ts'],
  testTimeout: 30000, // 30 seconds for integration tests
}; 