import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    // Test execution environment
    testEnvironment: "node",

    // File extensions to process
    moduleFileExtensions: ["ts", "js", "json"],

    // Runs .ts test files as native ESM (required to load ESM-only node_modules deps, e.g. @mikro-orm/*)
    extensionsToTreatAsEsm: [".ts"],

    // Stop testing after the first failure
    bail: true,

    // Reset mocks between tests
    clearMocks: true,

    // Detect lingering async operations
    detectOpenHandles: true,

    // Force process exit after tests complete
    forceExit: true,

    // Verbose output
    verbose: true,

    // TypeScript transformation
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: { module: "ES2022", moduleResolution: "Bundler" },
                useESM: true,
            },
        ],
    },

    // Root directories for tests
    roots: ["<rootDir>/src"],

    // Path aliases mapping
    moduleNameMapper: {
        "^~infrastructure$": "<rootDir>/src/infrastructure",
        "^~infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
        "^~observability$": "<rootDir>/src/observability",
        "^~observability/(.*)$": "<rootDir>/src/observability/$1",
        "^~bootstrap/(.*)$": "<rootDir>/src/bootstrap/$1",
        "^~context/(.*)$": "<rootDir>/src/context/$1",
        "^~common/(.*)$": "<rootDir>/src/common/$1",
    },

    // Scripts to run before the test environment
    setupFiles: ["reflect-metadata", "<rootDir>/src/extensions.ts"],
};

export default config;
