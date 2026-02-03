import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { type Options } from "@mikro-orm/core";
import { ConfigService } from "@nestjs/config";
import path from "path";

export abstract class MikroOrmConfig {
    public static buildOptions(config: ConfigService, kind: MikroORM.ConnectionKind = "write"): Options<PostgreSqlDriver> {
        const cqrsEnabled = config.getOrThrow<string>("POSTGRESQL_CQRS_ENABLED") === "true";

        const sslEnabled = config.getOrThrow<string>("POSTGRESQL_SSL") === "true";
        const rejectUnauthorized = config.getOrThrow<string>("POSTGRESQL_SSL_REJECT_UNAUTHORIZED") === "true";

        const host = this.resolveHost({ config, kind, cqrsEnabled });
        const port = this.resolvePort({ config, kind, cqrsEnabled });
        const pool = this.resolvePool({ config, kind, cqrsEnabled });

        const options: Options<PostgreSqlDriver> = {
            driver: PostgreSqlDriver,

            host: host,
            port: port,
            user: config.getOrThrow<string>("POSTGRESQL_USER"),
            password: config.getOrThrow<string>("POSTGRESQL_PASS"),
            dbName: config.getOrThrow<string>("POSTGRESQL_NAME"),
            debug: config.getOrThrow<string>("POSTGRESQL_LOGGING") === "true",

            entities: [path.join(process.cwd(), "dist/**/*.schema.js")],
            entitiesTs: [path.join(process.cwd(), "src/**/*.schema.ts")],

            pool: pool,

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

        return options;
    }

    private static resolveHost({ cqrsEnabled, config, kind }: MikroORM.Config.ResolveHost.Props): string {
        if (cqrsEnabled) {
            if (kind === "read") {
                return config.getOrThrow<string>("POSTGRESQL_READ_HOST");
            } else {
                return config.getOrThrow<string>("POSTGRESQL_WRITE_HOST");
            }
        } else {
            return config.getOrThrow<string>("POSTGRESQL_HOST");
        }
    }

    private static resolvePort({ cqrsEnabled, config, kind }: MikroORM.Config.ResolvePort.Props): number {
        if (cqrsEnabled) {
            if (kind === "read") {
                return Number(config.getOrThrow<number>("POSTGRESQL_READ_PORT"));
            } else {
                return Number(config.getOrThrow<number>("POSTGRESQL_WRITE_PORT"));
            }
        } else {
            return Number(config.getOrThrow<number>("POSTGRESQL_PORT"));
        }
    }

    private static resolvePool({
        cqrsEnabled,
        config,
        kind,
    }: MikroORM.Config.ResolvePool.Props): MikroORM.Config.ResolvePool.Result {
        if (cqrsEnabled) {
            if (kind === "read") {
                return {
                    max: Number(config.getOrThrow<number>("POSTGRESQL_READ_POOL_MAX")),
                    idleTimeoutMillis: Number(config.getOrThrow<number>("POSTGRESQL_READ_POOL_IDLE_MS")),
                };
            } else {
                return {
                    max: Number(config.getOrThrow<number>("POSTGRESQL_WRITE_POOL_MAX")),
                    idleTimeoutMillis: Number(config.getOrThrow<number>("POSTGRESQL_WRITE_POOL_IDLE_MS")),
                };
            }
        } else {
            return {
                max: Number(config.getOrThrow<number>("POSTGRESQL_POOL_MAX")),
                idleTimeoutMillis: Number(config.getOrThrow<number>("POSTGRESQL_POOL_IDLE_MS")),
            };
        }
    }
}
