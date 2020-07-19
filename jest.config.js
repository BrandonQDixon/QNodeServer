module.exports = {
    preset: 'ts-jest',
    verbose: true,
    collectCoverage: true,
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['src/Spec'],
    coverageReporters: ['json-summary', 'text', 'lcov'],
};
