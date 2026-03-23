/**
 * Jest configuration for pure unit tests (services, utilities).
 * Uses ts-jest with node environment — no React Native setup.
 * Run with: npx jest --config jest.unit.config.js
 */
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/services/**/*.test.ts', '<rootDir>/src/utils/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowJs: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
