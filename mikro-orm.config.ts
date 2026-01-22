import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { type Options } from "@mikro-orm/core";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const sslEnabled: boolean = process.env.POSTGRESQL_SSL === "true";
const rejectUnauthorized: boolean = process.env.POSTGRESQL_SSL_REJECT_UNAUTHORIZED === "true";

const config: Options<PostgreSqlDriver> = {
    driver: PostgreSqlDriver,

    host: process.env.POSTGRESQL_HOST,
    port: Number(process.env.POSTGRESQL_PORT),
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASS,
    dbName: process.env.POSTGRESQL_NAME,

    debug: process.env.NODE_ENV === "development",

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
        min: 2,
        max: 10,
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
