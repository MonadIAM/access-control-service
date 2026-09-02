import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import ms, { StringValue } from "ms";
import { readFileSync } from "fs";
import path from "path";

@Injectable()
export class MikroOrmConfig implements ORM.Config.Contract {
    public buildOptions(props: ORM.Config.BuildOptions.Props): ORM.Config.BuildOptions.Result {
        const { config, kind = "write" } = props;

        const host = this.resolveHost({ config, kind });
        const port = this.resolvePort({ config, kind });

        const pool = {
            idleTimeoutMillis: ms(config.getOrThrow<StringValue>("POSTGRES_POOL_IDLE_MS")),
            max: config.getOrThrow<number>("POSTGRES_POOL_MAX"),
        };

        const options: ORM.Options = {
            driver: PostgreSqlDriver,

            host: host,
            port: port,
            pool: pool,
            user: config.getOrThrow<string>("POSTGRES_USER"),
            dbName: config.getOrThrow<string>("POSTGRES_DB"),
            password: config.getOrThrow<string>("POSTGRES_PASSWORD"),
            debug: ["query", "query-params"],

            entities: [path.join(process.cwd(), "dist/**/*.schema.js")],
            entitiesTs: [path.join(process.cwd(), "src/**/*.schema.ts")],

            driverOptions: this.buildDriverOptions({ config, host }),
        };

        return options;
    }

    private buildDriverOptions(props: ORM.Config.BuildDriverOptions.Props): ORM.Config.BuildDriverOptions.Result {
        const { config, host } = props;

        if (config.get<boolean>("POSTGRES_SSL_ENABLED")) {
            const rejectUnauthorized = config.getOrThrow<boolean>("POSTGRES_SSL_REJECT_UNAUTHORIZED");
            const cert = readFileSync(config.getOrThrow<string>("POSTGRES_SSL_CERT_FILE"), "utf8");
            const key = readFileSync(config.getOrThrow<string>("POSTGRES_SSL_KEY_FILE"), "utf8");
            const ca = readFileSync(config.getOrThrow<string>("POSTGRES_SSL_CA_FILE"), "utf8");

            return {
                ssl: { rejectUnauthorized, servername: host, cert, key, ca },
            };
        } else {
            return {};
        }
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
}
