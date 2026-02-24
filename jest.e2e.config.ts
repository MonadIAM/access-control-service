import type { Config } from "@jest/types";

import common from "./configs/jest.base.config";

const config: Config.InitialOptions = {
    ...common,

    // Test file matching patterns
    testMatch: ["**/?*.e2e.spec.ts"],
    testTimeout: 30000
};

export default config;
