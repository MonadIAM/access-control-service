import common from "./configs/jest.base.config.mjs";

const config = {
    ...common,

    testMatch: ["**/*.integration.spec.ts"],
    testTimeout: 120_000,
    globalSetup: "<rootDir>/src/testing/integration/containers/setup.ts",
    globalTeardown: "<rootDir>/src/testing/integration/containers/teardown.ts",
    detectOpenHandles: false,
    maxWorkers: 1,
};

export default config;
