import type { KnipConfig } from "knip";

const config: KnipConfig = {
    ignoreExportsUsedInFile: true, // reduces noise from re-exports inside index.ts
    project: ["src/**/*.ts"],
    entry: [
        "mikro-orm.config.ts",
        "src/main.ts",
        // Standalone scripts - run directly, not via import
        "src/infrastructure/database/migrations/*.ts",
        "src/infrastructure/database/seeders/*.ts",
        "src/infrastructure/redis/seeder.ts",
        // MikroORM entity schemas - loaded via glob in mikro-orm.config.ts, not imported
        "src/common/transaction-manager/schemas/*.ts",
        "src/context/infrastructure/schemas/*.ts",
    ],
    ignoreDependencies: [
        // MikroORM CLI tools - used via makefile/npx, not imported
        "@mikro-orm/entity-generator",
        "@mikro-orm/cli",
        // Peer deps of @nestjs/swagger required by Fastify adapter - not imported directly
        "@fastify/swagger-ui",
        "@fastify/swagger",
        // Transitive - provided by @nestjs/platform-fastify and jest respectively
        "@jest/globals",
        "fastify",
        // CLI and path resolver for ts-node/jest
        "tsconfig-paths",
        "ts-node",
    ],
};

export default config;
