import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import ms, { StringValue } from "ms";
import { readFileSync } from "fs";
import path from "path";

import { PostgreSQLPoolRegistry } from "./pool.registry";

@Injectable()
export class MikroOrmConfig implements ORM.Config.Contract {
    public constructor(protected readonly poolRegistry: PostgreSQLPoolRegistry) {}

    public buildOptions(props: ORM.Config.BuildOptions.Props): ORM.Config.BuildOptions.Result {
        const { config, kind = "write" } = props;

        const host = this.resolveHost({ config, kind });
        const port = this.resolvePort({ config, kind });

        const options: ORM.Options = {
            driver: PostgreSqlDriver,

            host: host,
            port: port,
            user: config.getOrThrow<string>("POSTGRES_USER"),
            dbName: config.getOrThrow<string>("POSTGRES_DB"),
            password: config.getOrThrow<string>("POSTGRES_PASSWORD"),
            debug: ["query", "query-params"],

            entities: [path.join(process.cwd(), "dist/**/*.schema.js")],
            entitiesTs: [path.join(process.cwd(), "src/**/*.schema.ts")],

            pool: this.buildPoolOptions({ config, kind }),

            driverOptions: this.buildDriverOptions({ config, host, kind }),
        };

        return options;
    }

    public buildDriverOptions(props: ORM.Config.BuildDriverOptions.Props): ORM.Config.BuildDriverOptions.Result {
        const { config, host, kind } = props;

        const baseOptions = {
            onPoolCreated: (pool: ORM.PoolRegistry.Register.Props["pool"]): void => {
                this.poolRegistry.register({ kind, pool });
            },
        };

        if (config.get<boolean>("POSTGRES_SSL_ENABLED")) {
            const rejectUnauthorized = config.getOrThrow<boolean>("POSTGRES_SSL_REJECT_UNAUTHORIZED");
            const cert = readFileSync(config.getOrThrow<string>("POSTGRES_SSL_CERT_FILE"), "utf8");
            const key = readFileSync(config.getOrThrow<string>("POSTGRES_SSL_KEY_FILE"), "utf8");
            const ca = readFileSync(config.getOrThrow<string>("POSTGRES_SSL_CA_FILE"), "utf8");

            return {
                ...baseOptions,
                ssl: { rejectUnauthorized, servername: host, cert, key, ca },
            };
        } else {
            return baseOptions;
        }
    }

    public buildPoolOptions(props: ORM.Config.BuildPoolOptions.Props): ORM.Config.BuildPoolOptions.Result {
        const { config, kind } = props;

        return {
            idleTimeoutMillis: Number(ms(this.resolvePoolIdleMS({ config, kind }))),
            max: this.resolvePoolMax({ config, kind }),
        };
    }

    public resolveHost(props: ORM.Config.ResolveHost.Props): ORM.Config.ResolveHost.Result {
        const { config, kind } = props;
        if (kind === "read") {
            return config.getOrThrow<string>("POSTGRES_READ_HOST");
        } else {
            return config.getOrThrow<string>("POSTGRES_WRITE_HOST");
        }
    }

    public resolvePort(props: ORM.Config.ResolvePort.Props): ORM.Config.ResolvePort.Result {
        const { config, kind } = props;
        if (kind === "read") {
            return config.getOrThrow<number>("POSTGRES_READ_PORT");
        } else {
            return config.getOrThrow<number>("POSTGRES_WRITE_PORT");
        }
    }

    public resolvePoolMax(props: ORM.Config.ResolvePoolMax.Props): ORM.Config.ResolvePoolMax.Result {
        const { config, kind } = props;
        if (kind === "read") {
            return config.getOrThrow<number>("POSTGRES_READ_POOL_MAX");
        } else {
            return config.getOrThrow<number>("POSTGRES_WRITE_POOL_MAX");
        }
    }

    public resolvePoolIdleMS(props: ORM.Config.ResolvePoolIdleMS.Props): ORM.Config.ResolvePoolIdleMS.Result {
        const { config, kind } = props;
        if (kind === "read") {
            return config.getOrThrow<StringValue>("POSTGRES_READ_POOL_IDLE_MS");
        } else {
            return config.getOrThrow<StringValue>("POSTGRES_WRITE_POOL_IDLE_MS");
        }
    }
}
