module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@fixtures/(.*)$': '<rootDir>/fixtures/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
  },
  testMatch: ['**/unit/**/*.spec.ts', '**/integration/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../srv-back/src/**/*.(t|j)s',
    '!../srv-back/src/main.ts',
    '!../srv-back/src/**/*.module.ts',
    '!../srv-back/src/**/*.interface.ts',
    '!../srv-back/src/**/*.dto.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 30000,
};
