"use strict";
// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/__tests__'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
                tsconfig: 'tsconfig.json'
            }]
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/server.ts',
        '!src/app.ts',
        '!src/db/migrations/**',
        '!src/db/seeds/**',
        '!src/db/cleanup.ts',
        '!src/db/testConnection.ts',
        '!src/db/migrationRunner.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts']
};
//# sourceMappingURL=jest.config.js.map