const config = {
    testEnvironment: "node",

    moduleFileExtensions: ["ts", "js", "json"],

    extensionsToTreatAsEsm: [".ts"],

    bail: true,

    clearMocks: true,

    detectOpenHandles: true,

    forceExit: true,

    verbose: true,

    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: { module: "ES2022", moduleResolution: "Bundler" },
                useESM: true,
            },
        ],
    },

    roots: ["<rootDir>/src"],

    moduleNameMapper: {
        "^~infrastructure$": "<rootDir>/src/infrastructure",
        "^~infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
        "^~observability$": "<rootDir>/src/observability",
        "^~observability/(.*)$": "<rootDir>/src/observability/$1",
        "^~bootstrap/(.*)$": "<rootDir>/src/bootstrap/$1",
        "^~context/(.*)$": "<rootDir>/src/context/$1",
        "^~common/(.*)$": "<rootDir>/src/common/$1",
        "^~testing/(.*)$": "<rootDir>/src/testing/$1",
        "^~root/(.*)$": "<rootDir>/$1",
    },

    setupFiles: ["reflect-metadata", "<rootDir>/src/extensions.ts"],
};

export default config;
