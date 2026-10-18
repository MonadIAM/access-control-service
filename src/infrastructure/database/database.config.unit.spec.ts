import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import * as fs from "fs";
import path from "path";

import { PostgreSQLPoolRegistry } from "./pool.registry";
import { MikroOrmConfig as DatabaseConfig } from "./database.config";

const readFileSync = jest.fn<(path: string, encoding: string) => string>();
jest.unstable_mockModule("fs", () => ({ ...fs, readFileSync }));
let MikroOrmConfig: typeof DatabaseConfig;

const values = {
    POSTGRES_USER: "service",
    POSTGRES_PASSWORD: "secret",
    POSTGRES_DB: "access_control",
    POSTGRES_READ_HOST: "replica",
    POSTGRES_READ_PORT: 5433,
    POSTGRES_READ_POOL_MAX: 5,
    POSTGRES_READ_POOL_IDLE_MS: "2s",
    POSTGRES_WRITE_HOST: "primary",
    POSTGRES_WRITE_PORT: 5432,
    POSTGRES_WRITE_POOL_MAX: 10,
    POSTGRES_WRITE_POOL_IDLE_MS: "1m",
};
const tls = {
    POSTGRES_SSL_ENABLED: true,
    POSTGRES_SSL_REJECT_UNAUTHORIZED: true,
    POSTGRES_SSL_CA_FILE: "/ca",
};

describe("[Config] - MikroOrm", () => {
    let registry: PostgreSQLPoolRegistry;
    let builder: DatabaseConfig;

    beforeAll(async () => {
        const modulePath = "./database.config";
        ({ MikroOrmConfig } = await import(modulePath));
    });

    beforeEach(() => {
        registry = new PostgreSQLPoolRegistry();
        builder = new MikroOrmConfig(registry);
        readFileSync.mockReset().mockImplementation((file) => `contents:${file}`);
    });

    describe("[Method] - buildOptions", () => {
        it.each([
            { kind: "read" as const, host: "replica", port: 5433, max: 5, idleTimeoutMillis: 2000 },
            { kind: "write" as const, host: "primary", port: 5432, max: 10, idleTimeoutMillis: 60000 },
        ])(
            "[case] - builds $kind options and registers the corresponding pool",
            ({ kind, host, port, max, idleTimeoutMillis }) => {
                // Arrange

                // Act
                const options = builder.buildOptions({ config: new ConfigService(values), kind });
                options.driverOptions!.onPoolCreated(new Pool({ max }));
                const result = registry.snapshot({ kind });

                // Assert
                expect(options).toMatchObject({
                    driver: PostgreSqlDriver,
                    host,
                    port,
                    user: "service",
                    password: "secret",
                    dbName: "access_control",
                    pool: { max, idleTimeoutMillis },
                    entities: [path.join(process.cwd(), "dist/**/*.schema.js")],
                    entitiesTs: [path.join(process.cwd(), "src/**/*.schema.ts")],
                });
                expect(options.driverOptions).not.toHaveProperty("ssl");
                expect(readFileSync).not.toHaveBeenCalled();
                expect(result).toMatchObject({ kind, max });
            },
        );

        it("[case] - uses the write connection by default", () => {
            // Arrange

            // Act
            const result = builder.buildOptions({ config: new ConfigService(values) });

            // Assert
            expect(result).toMatchObject({
                host: "primary",
                port: 5432,
            });
        });

        it.each([true, false])("[case] - preserves TLS verification=%s and certificate contents", (rejectUnauthorized) => {
            // Arrange

            // Act
            const options = builder.buildOptions({
                config: new ConfigService({ ...values, ...tls, POSTGRES_SSL_REJECT_UNAUTHORIZED: rejectUnauthorized }),
                kind: "read",
            });
            options.driverOptions!.onPoolCreated(new Pool({ max: 7 }));
            const result = registry.snapshot({ kind: "read" });

            // Assert
            expect(options.driverOptions!.ssl).toEqual({
                rejectUnauthorized,
                servername: "replica",
                ca: "contents:/ca",
            });
            expect(readFileSync.mock.calls).toEqual([["/ca", "utf8"]]);
            expect(result).toMatchObject({ max: 7 });
        });

        it.each(["read", "write"] as const)(
            "[case] - supports CNPG password authentication with CA-only TLS for %s",
            (kind) => {
                // Arrange
                const config = new ConfigService({
                    ...values,
                    ...tls,
                });

                // Act
                const options = builder.buildOptions({ config, kind });

                // Assert
                expect(options.driverOptions!.ssl).toEqual({
                    ca: "contents:/ca",
                    rejectUnauthorized: true,
                    servername: kind === "read" ? "replica" : "primary",
                });
                expect(readFileSync.mock.calls).toEqual([["/ca", "utf8"]]);
            },
        );

        it("[case] - propagates certificate read failures", () => {
            // Arrange
            const error = new Error("certificate unavailable");
            readFileSync.mockImplementation(() => {
                throw error;
            });

            // Act
            const act = (): unknown => builder.buildOptions({ config: new ConfigService({ ...values, ...tls }) });

            // Assert
            expect(act).toThrow(error);
        });

        it("[case] - requires the credentials", () => {
            // Arrange

            // Act
            const act = (): unknown =>
                builder.buildOptions({ config: new ConfigService({ ...values, POSTGRES_PASSWORD: undefined }) });

            // Assert
            expect(act).toThrow("POSTGRES_PASSWORD");
        });
    });
});
