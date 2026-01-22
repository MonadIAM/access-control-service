import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { type Options } from "@mikro-orm/core";
import { ConfigService } from "@nestjs/config";
import path from "path";

export abstract class MikroOrmConfig {
    /**
     * Строит Options для MikroORM на основе переменных окружения.
     * Параметры пула и SSL повторяют существующую конфигурацию.
     */
    public static buildOptions(config: ConfigService): Options<PostgreSqlDriver> {
        const sslEnabled = config.getOrThrow<string>("POSTGRESQL_SSL") === "true";
        const rejectUnauthorized = config.get<string>("POSTGRESQL_SSL_REJECT_UNAUTHORIZED") === "true";

        const options: Options<PostgreSqlDriver> = {
            driver: PostgreSqlDriver,
            host: config.getOrThrow<string>("POSTGRESQL_HOST"),
            port: Number(config.getOrThrow<number>("POSTGRESQL_PORT")),
            user: config.getOrThrow<string>("POSTGRESQL_USER"),
            password: config.getOrThrow<string>("POSTGRESQL_PASS"),
            dbName: config.getOrThrow<string>("POSTGRESQL_NAME"),
            debug: config.getOrThrow<string>("POSTGRESQL_LOGGING") === "true",
            entities: [path.join(process.cwd(), "dist/**/*.entity.js")],
            entitiesTs: [path.join(process.cwd(), "src/**/*.entity.ts")],
            migrations: {
                path: path.join(process.cwd(), "dist/src/infrastructure/database/migrations"),
                pathTs: path.join(process.cwd(), "src/infrastructure/database/migrations"),
                tableName: "mikro_orm_migrations",
                glob: "!(*.d).{js,ts}",
                transactional: true, // Запуск каждой миграции внутри транзакции. (позволяет автоматически откатит ьв случае провала части миграции)
                allOrNothing: true, // Гарантирует атомарность всей пачки миграций. (падение одно = откат всех)
            },
            pool: {
                max: Number(config.getOrThrow<number>("POSTGRESQL_POOL_MAX")),
                idleTimeoutMillis: Number(config.getOrThrow<number>("POSTGRESQL_POOL_IDLE_MS")),
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
            logger: (message: string) => console.log(JSON.stringify({ level: 30, msg: message, context: "MikroORM" })),
        };

        return options;
    }
}
