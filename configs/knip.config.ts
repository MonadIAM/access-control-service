import type { KnipConfig } from "knip";

const config: KnipConfig = {
    ignoreExportsUsedInFile: true, // reduces noise from re-exports inside index.ts
    project: ["src/**/*.ts", "cli/**/*.ts"],
    entry: [
        "mikro-orm.config.ts",
        "src/main.ts",
        // CLI tools - run directly via npm scripts
        "cli/postman/patch.ts",
        "cli/postman/main.ts",
        // Standalone scripts - run directly, not via import
        "src/infrastructure/database/migrations/*.ts",
        "src/infrastructure/database/seeder.ts",
        "src/infrastructure/redis/seeder.ts",
        // MikroORM entity schemas - loaded via glob in mikro-orm.config.ts, not imported
        "src/common/transaction-manager/schemas/*.ts",
        "src/context/infrastructure/schemas/*.ts",
    ],
    ignoreDependencies: [
        "@mikro-orm/entity-generator",
        "@mikro-orm/cli",
        "@fastify/swagger-ui",
        "@fastify/swagger",
        "@jest/globals",
        "fastify",
        "tsx",
    ],
};

export default config;
