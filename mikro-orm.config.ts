import { type Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import path from "path";
import ms from "ms";

dotenv.config();

const sslEnabled: boolean = process.env.POSTGRES_SSL_ENABLED === "true";
const rejectUnauthorized: boolean = process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === "true";
const poolIdleTimeoutMillis: Optional<number> = ms(process.env.POSTGRES_WRITE_POOL_IDLE_MS);
const poolMax: number = Number(process.env.POSTGRES_WRITE_POOL_MAX);
const port: number = Number(process.env.POSTGRES_WRITE_PORT);
const host: string = process.env.POSTGRES_WRITE_HOST;

const config: Options = {
    driver: PostgreSqlDriver,

    password: process.env.POSTGRES_PASSWORD,
    dbName: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    host,
    port,

    debug: process.env.POSTGRES_LOGGING === "true" || process.env.NODE_ENV === "local",

    entities: [path.join(process.cwd(), "dist/**/*.schema.js")],
    entitiesTs: [path.join(process.cwd(), "src/**/*.schema.ts")],

    extensions: [Migrator],

    /**
     * Migrations are only executed via the write configuration.
     * The migrations section is kept in the read config to keep Options valid,
     * but running migrations through that connection is forbidden at the application level.
     */
    migrations: {
        path: path.join(process.cwd(), "dist/src/infrastructure/database/migrations"),
        pathTs: path.join(process.cwd(), "src/infrastructure/database/migrations"),
        tableName: "mikro_orm_migrations",
        glob: "!(*.d).{js,ts}",
        transactional: true, // Run each migration inside a transaction (allows automatic rollback on partial failure)
        allOrNothing: false, // Commit each migration separately; preserve previously applied migrations on failure
        fileName: (timestamp: string, name?: string) => {
            const prefix = timestamp.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1.$2.$3T$4-$5-$6");
            if (name) {
                return `${prefix}__${name}`;
            } else {
                return `${prefix}`;
            }
        },
    },

    seeder: {
        path: "./src/infrastructure/database",
        defaultSeeder: "System",
    },

    pool: {
        idleTimeoutMillis: poolIdleTimeoutMillis,
        max: poolMax,
        min: 1,
    },

    driverOptions: sslEnabled
        ? {
              ssl: {
                  cert: readFileSync(process.env.POSTGRES_SSL_CERT_FILE!, "utf8"),
                  key: readFileSync(process.env.POSTGRES_SSL_KEY_FILE!, "utf8"),
                  ca: readFileSync(process.env.POSTGRES_SSL_CA_FILE!, "utf8"),
                  rejectUnauthorized,
                  servername: host,
              },
          }
        : {},
};

export default config;
