module.exports = {
    testTimeout: 30e3,
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'test/tsconfig.json',
            isolatedModules: true,
        }],
    },
    testEnvironment: 'node',
    collectCoverage: false,
    collectCoverageFrom: [
        '<rootDir>/packages/*/src/**/*.ts',
    ],
    moduleNameMapper: {
        '@apify/(.*)': '<rootDir>/packages/$1/src',
    },
    modulePathIgnorePatterns: [
        'dist/package.json',
        '<rootDir>/package.json',
    ],
};
