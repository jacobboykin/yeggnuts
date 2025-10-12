import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/index.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: false,
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 65,
      lines: 60,
      statements: 60,
    },
  },
};

export default config;
