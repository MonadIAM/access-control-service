import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { type Options } from "@mikro-orm/core";
import { ConfigService } from "@nestjs/config";
import path from "path";
import ms from "ms";

export abstract class MikroOrmConfig {
    public static buildOptions(config: ConfigService, kind: MikroORM.ConnectionKind = "write"): Options<PostgreSqlDriver> {
        const cqrsEnabled = config.getOrThrow<string>("POSTGRES_CQRS_ENABLED") === "true";

        const sslEnabled = config.getOrThrow<string>("POSTGRES_SSL") === "true";
        const rejectUnauthorized = config.getOrThrow<string>("POSTGRES_SSL_REJECT_UNAUTHORIZED") === "true";

        const host = this.resolveHost({ config, kind, cqrsEnabled });
        const port = this.resolvePort({ config, kind, cqrsEnabled });
        const pool = this.resolvePool({ config, kind, cqrsEnabled });

        const options: Options<PostgreSqlDriver> = {
            driver: PostgreSqlDriver,

            host: host,
            port: port,
            user: config.getOrThrow<string>("POSTGRES_USER"),
            dbName: config.getOrThrow<string>("POSTGRES_DB"),
            password: config.getOrThrow<string>("POSTGRES_PASSWORD"),
            debug: ["query", "query-params"],

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
                return config.getOrThrow<string>("POSTGRES_READ_HOST");
            } else {
                return config.getOrThrow<string>("POSTGRES_WRITE_HOST");
            }
        } else {
            return config.getOrThrow<string>("POSTGRES_HOST");
        }
    }

    private static resolvePort({ cqrsEnabled, config, kind }: MikroORM.Config.ResolvePort.Props): number {
        if (cqrsEnabled) {
            if (kind === "read") {
                return Number(config.getOrThrow<number>("POSTGRES_READ_PORT"));
            } else {
                return Number(config.getOrThrow<number>("POSTGRES_WRITE_PORT"));
            }
        } else {
            return Number(config.getOrThrow<number>("POSTGRES_PORT"));
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
                    idleTimeoutMillis: Number(ms(config.getOrThrow("POSTGRES_READ_POOL_IDLE_MS"))),
                    max: Number(config.getOrThrow<number>("POSTGRES_READ_POOL_MAX")),
                };
            } else {
                return {
                    idleTimeoutMillis: Number(ms(config.getOrThrow("POSTGRES_WRITE_POOL_IDLE_MS"))),
                    max: Number(config.getOrThrow<number>("POSTGRES_WRITE_POOL_MAX")),
                };
            }
        } else {
            return {
                idleTimeoutMillis: Number(ms(config.getOrThrow("POSTGRES_POOL_IDLE_MS"))),
                max: Number(config.getOrThrow<number>("POSTGRES_POOL_MAX")),
            };
        }
    }
}
