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
                tsconfig: { module: "ES2022", moduleResolution: "Bundler", sourceMap: true, inlineSources: true },
                useESM: true,
            },
        ],
    },

    roots: ["<rootDir>/src"],

    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/*.d.ts",
        "!src/**/{main,seeder,index,constants,enums,tokens}.ts",
        "!src/**/*.{examples,module,schema,dto,generated,spec}.ts",
        "!src/infrastructure/database/migrations/**",
        "!src/infrastructure/datasets/**",
        "!src/testing/**",
    ],

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
