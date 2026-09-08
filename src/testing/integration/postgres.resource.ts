import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { MikroORM, Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import path from "node:path";

import {
    CONNECTION_ENV_KEYS,
    IDENTIFIER_PATTERN,
    TRUNCATED_SCHEMAS,
    DATABASE_PASSWORD,
    EXCLUDED_TABLES,
    POSTGRES_IMAGE,
    DATABASE_NAME,
    DATABASE_USER,
} from "./constants";

let container: Optional<StartedPostgreSqlContainer>;

export class PostgresResource implements Integration.Postgres.Resource.Contract {
    private constructor(public readonly orm: MikroORM) {}

    public static async start(): Promise<PostgresResource> {
        container = await new PostgreSqlContainer(POSTGRES_IMAGE)
            .withDatabase(DATABASE_NAME)
            .withUsername(DATABASE_USER)
            .withPassword(DATABASE_PASSWORD)
            .start();
        let orm: Optional<MikroORM>;

        try {
            const connection = PostgresResource.containerConnection(container);
            PostgresResource.assignConnectionEnv(connection);

            orm = await MikroORM.init(PostgresResource.buildOptions(connection));
            await orm.migrator.up();

            return new PostgresResource(orm);
        } catch (error) {
            await orm?.close(true);
            await container.stop();
            container = undefined;
            throw error;
        }
    }

    public static async connect(): Promise<PostgresResource> {
        return new PostgresResource(await MikroORM.init(PostgresResource.buildOptions(PostgresResource.envConnection())));
    }

    public async reset(): Integration.Postgres.Resource.Reset.Result {
        const tables = await this.truncatedTables();

        if (tables.length > 0) {
            await this.orm.em.getConnection().execute(`TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`);
        }

        this.orm.em.getUnitOfWork(false).clear();
    }

    public async close(): Integration.Postgres.Resource.Close.Result {
        await this.orm.close(true);
    }

    public static async stop(): Integration.Postgres.Resource.Close.Result {
        if (container) {
            await container.stop();
            container = undefined;
        }
    }

    private static buildOptions(connection: Integration.Postgres.Resource.Connection.Props): Options {
        return {
            driver: PostgreSqlDriver,
            host: connection.host,
            port: connection.port,
            dbName: connection.database,
            user: connection.username,
            password: connection.password,
            debug: false,
            entities: [path.join(process.cwd(), "dist/**/*.schema.js")],
            entitiesTs: [path.join(process.cwd(), "src/**/*.schema.ts")],
            extensions: [Migrator],
            migrations: {
                path: path.join(process.cwd(), "dist/src/infrastructure/database/migrations"),
                pathTs: path.join(process.cwd(), "src/infrastructure/database/migrations"),
                tableName: "mikro_orm_migrations",
                glob: "!(*.d).{js,ts}",
                transactional: true,
                allOrNothing: true,
                snapshot: false,
            },
            pool: {
                min: 1,
                max: 4,
            },
        };
    }

    private static containerConnection(
        startedContainer: StartedPostgreSqlContainer,
    ): Integration.Postgres.Resource.Connection.Props {
        return {
            database: startedContainer.getDatabase(),
            username: startedContainer.getUsername(),
            password: startedContainer.getPassword(),
            host: startedContainer.getHost(),
            port: startedContainer.getPort(),
        };
    }

    private static assignConnectionEnv(connection: Integration.Postgres.Resource.Connection.Props): void {
        process.env[CONNECTION_ENV_KEYS.host] = connection.host;
        process.env[CONNECTION_ENV_KEYS.port] = String(connection.port);
        process.env[CONNECTION_ENV_KEYS.database] = connection.database;
        process.env[CONNECTION_ENV_KEYS.username] = connection.username;
        process.env[CONNECTION_ENV_KEYS.password] = connection.password;
    }

    private static envConnection(): Integration.Postgres.Resource.Connection.Props {
        const port = Number(process.env[CONNECTION_ENV_KEYS.port]);
        if (Number.isInteger(port)) {
            return {
                database: PostgresResource.requiredEnv(CONNECTION_ENV_KEYS.database),
                username: PostgresResource.requiredEnv(CONNECTION_ENV_KEYS.username),
                password: PostgresResource.requiredEnv(CONNECTION_ENV_KEYS.password),
                host: PostgresResource.requiredEnv(CONNECTION_ENV_KEYS.host),
                port,
            };
        } else {
            throw new Error("Postgres test resource port is not configured");
        }
    }

    private static requiredEnv(name: string): string {
        if (process.env[name]) {
            return process.env[name];
        } else {
            throw new Error(`${name} is not configured`);
        }
    }

    private async truncatedTables(): Promise<string[]> {
        const placeholders = TRUNCATED_SCHEMAS.map(() => "?").join(", ");
        const rows = await this.orm.em.getConnection().execute<{ schemaname: string; tablename: string }[]>(
            `
                SELECT schemaname, tablename
                FROM pg_tables
                WHERE schemaname IN (${placeholders})
                  AND tablename <> ?
                ORDER BY schemaname, tablename
            `,
            [...TRUNCATED_SCHEMAS, EXCLUDED_TABLES[0]],
        );

        return rows.map(
            ({ schemaname, tablename }) => `${this.quoteIdentifier(schemaname)}.${this.quoteIdentifier(tablename)}`,
        );
    }

    private quoteIdentifier(identifier: string): string {
        if (IDENTIFIER_PATTERN.test(identifier)) {
            return `"${identifier}"`;
        } else {
            throw new Error(`Unsafe PostgreSQL identifier: ${identifier}`);
        }
    }
}
