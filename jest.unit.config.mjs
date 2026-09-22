import common from "./configs/jest.base.config.mjs";

const config = {
    ...common,

    testMatch: ["**/*.unit.spec.ts"],

    coverageThreshold: {
        global: { statements: 0, lines: 0, functions: 0, branches: 0 },
    },
};

export default config;
