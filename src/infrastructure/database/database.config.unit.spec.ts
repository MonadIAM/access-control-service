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
    POSTGRES_SSL_CERT_FILE: "/cert",
    POSTGRES_SSL_KEY_FILE: "/key",
    POSTGRES_SSL_CA_FILE: "/ca",
};

describe("MikroOrmConfig", () => {
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

    it.each([
        { kind: "read" as const, host: "replica", port: 5433, max: 5, idleTimeoutMillis: 2000 },
        { kind: "write" as const, host: "primary", port: 5432, max: 10, idleTimeoutMillis: 60000 },
    ])("builds $kind options and registers the corresponding pool", ({ kind, host, port, max, idleTimeoutMillis }) => {
        const options = builder.buildOptions({ config: new ConfigService(values), kind });
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
        options.driverOptions!.onPoolCreated(new Pool({ max }));
        expect(registry.snapshot({ kind })).toMatchObject({ kind, max });
    });

    it("uses the write connection by default", () => {
        expect(builder.buildOptions({ config: new ConfigService(values) })).toMatchObject({ host: "primary", port: 5432 });
    });

    it.each([true, false])("preserves TLS verification=%s and certificate contents", (rejectUnauthorized) => {
        const options = builder.buildOptions({
            config: new ConfigService({ ...values, ...tls, POSTGRES_SSL_REJECT_UNAUTHORIZED: rejectUnauthorized }),
            kind: "read",
        });
        expect(options.driverOptions!.ssl).toEqual({
            rejectUnauthorized,
            servername: "replica",
            cert: "contents:/cert",
            key: "contents:/key",
            ca: "contents:/ca",
        });
        expect(readFileSync.mock.calls).toEqual([
            ["/cert", "utf8"],
            ["/key", "utf8"],
            ["/ca", "utf8"],
        ]);
        options.driverOptions!.onPoolCreated(new Pool({ max: 7 }));
        expect(registry.snapshot({ kind: "read" })).toMatchObject({ max: 7 });
    });

    it("propagates certificate read failures", () => {
        const error = new Error("certificate unavailable");
        readFileSync.mockImplementation(() => {
            throw error;
        });
        expect(() => builder.buildOptions({ config: new ConfigService({ ...values, ...tls }) })).toThrow(error);
    });

    it("requires the credentials", () => {
        expect(() =>
            builder.buildOptions({ config: new ConfigService({ ...values, POSTGRES_PASSWORD: undefined }) }),
        ).toThrow("POSTGRES_PASSWORD");
    });
});
