import integration from "./jest.integration.config.mjs";

export default {
    ...integration,
    testMatch: ["**/*.unit.spec.ts", "**/*.integration.spec.ts"],
    coverageDirectory: "<rootDir>/coverage/all",
};
