import type { KnipConfig } from "knip";

const config: KnipConfig = {
    ignoreExportsUsedInFile: true, // reduces noise from re-exports inside index.ts
    project: ["src/**/*.ts"],
    ignore: [
        // Generated from the dictionaries by "pnpm run intl:types"
        "src/common/dictionaries/intl.generated.ts",
    ],
    entry: [
        "mikro-orm.config.ts",
        "src/main.ts",
        // Standalone scripts - run directly, not via import
        "src/infrastructure/database/migrations/*.ts",
        "src/infrastructure/database/seeder.ts",
        // MikroORM entity schemas - loaded via glob in mikro-orm.config.ts, not imported
        "src/common/transaction-manager/schemas/*.ts",
        "src/context/infrastructure/schemas/*.ts",
        // Barrel files
        "src/**/index.ts",
        // Preload script
        "src/observability/tracing/script.ts",
    ],
    ignoreDependencies: [
        "@mikro-orm/entity-generator",
        "@types/har-format",
    ],
};

export default config;
