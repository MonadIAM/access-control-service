import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { type Options } from "@mikro-orm/core";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const sslEnabled: boolean = process.env.POSTGRESQL_SSL === "true";
const rejectUnauthorized: boolean = process.env.POSTGRESQL_SSL_REJECT_UNAUTHORIZED === "true";

const cqrsEnabled: boolean = process.env.POSTGRESQL_CQRS_ENABLED === "true";

const host: Optional<string> = cqrsEnabled ? process.env.POSTGRESQL_WRITE_HOST : process.env.POSTGRESQL_HOST;
const port: number = Number(cqrsEnabled ? process.env.POSTGRESQL_WRITE_PORT : process.env.POSTGRESQL_PORT);

const poolMax: number = Number(
    cqrsEnabled ? process.env.POSTGRESQL_WRITE_POOL_MAX ?? process.env.POSTGRESQL_POOL_MAX : process.env.POSTGRESQL_POOL_MAX,
);

const poolIdleTimeoutMillis: Optional<number> = cqrsEnabled
    ? Number(process.env.POSTGRESQL_WRITE_POOL_IDLE_MS ?? process.env.POSTGRESQL_POOL_IDLE_MS)
    : process.env.POSTGRESQL_POOL_IDLE_MS
      ? Number(process.env.POSTGRESQL_POOL_IDLE_MS)
      : undefined;

const config: Options<PostgreSqlDriver> = {
    driver: PostgreSqlDriver,

    host: host,
    port: port,
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASS,
    dbName: process.env.POSTGRESQL_NAME,

    debug: process.env.POSTGRESQL_LOGGING === "true" || process.env.NODE_ENV === "development",

    entities: [path.join(process.cwd(), "dist/**/*.entity.js")],
    entitiesTs: [path.join(process.cwd(), "src/**/*.entity.ts")],

    extensions: [Migrator],

    migrations: {
        path: path.join(process.cwd(), "dist/src/infrastructure/database/migrations"),
        pathTs: path.join(process.cwd(), "src/infrastructure/database/migrations"),
        tableName: "mikro_orm_migrations",
        glob: "!(*.d).{js,ts}",
        transactional: true,
        allOrNothing: true,
    },

    pool: {
        min: 1,
        max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 2,
        ...(poolIdleTimeoutMillis && Number.isFinite(poolIdleTimeoutMillis) && poolIdleTimeoutMillis > 0
            ? { idleTimeoutMillis: poolIdleTimeoutMillis }
            : {}),
    },

    driverOptions: sslEnabled
        ? {
              connection: {
                  ssl: {
                      rejectUnauthorized: rejectUnauthorized,
                  },
              },
          }
        : undefined,
};

export default config;
