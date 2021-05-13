module.exports = {
    testTimeout: 30e3,
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: false,
    collectCoverageFrom: [
        '<rootDir>/packages/*/src/**/*.ts',
    ],
    moduleNameMapper: {
        '@lerna-test-v1/(.*)': '<rootDir>/packages/$1/src',
    },
    modulePathIgnorePatterns: [
        'dist/package.json',
        '<rootDir>/package.json',
    ],
    globals: {
        'ts-jest': {
            tsconfig: 'test/tsconfig.json',
        },
    },
};
