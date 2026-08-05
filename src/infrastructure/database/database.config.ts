import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import ms, { StringValue } from "ms";
import path from "path";

@Injectable()
export class MikroOrmConfig implements ORM.Config.Contract {
    public buildOptions(props: ORM.Config.BuildOptions.Props): ORM.Config.BuildOptions.Result {
        const { config, kind = "write" } = props;
        const cqrsEnabled = config.getOrThrow<string>("POSTGRES_CQRS_ENABLED") === "true";

        const sslEnabled = config.getOrThrow<string>("POSTGRES_SSL") === "true";
        const rejectUnauthorized = config.getOrThrow<string>("POSTGRES_SSL_REJECT_UNAUTHORIZED") === "true";

        const host = this.resolveHost({ config, kind, cqrsEnabled });

        const pool = {
            idleTimeoutMillis: ms(config.getOrThrow<StringValue>("POSTGRES_POOL_IDLE_MS")),
            max: Number(config.getOrThrow<number>("POSTGRES_POOL_MAX")),
        };

        const options: ORM.Options = {
            driver: PostgreSqlDriver,

            host: host,
            port: Number(config.getOrThrow<number>("POSTGRES_PORT")),
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

    public resolveHost(props: ORM.Config.ResolveHost.Props): ORM.Config.ResolveHost.Result {
        const { cqrsEnabled, config, kind } = props;
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
}
