import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { RedisConfig as Config } from "./redis.config";

const readFileSync = jest.fn<(path: string, encoding: string) => string>();
jest.unstable_mockModule("fs", () => ({ readFileSync }));
let RedisConfig: typeof Config;

const values = {
    REDIS_HOST: "redis.internal",
    REDIS_PASSWORD: "secret",
    REDIS_DB_LIMITER: 2,
    REDIS_DB_CACHE: 0,
    REDIS_DB_QUEUE: 3,
    REDIS_PORT: 6380,
};
const tls = {
    REDIS_TLS_ENABLED: true,
    REDIS_TLS_REJECT_UNAUTHORIZED: true,
    REDIS_TLS_CERT_FILE: "/cert",
    REDIS_TLS_KEY_FILE: "/key",
    REDIS_TLS_CA_FILE: "/ca",
};

describe("RedisConfig", () => {
    beforeAll(async () => {
        const modulePath = "./redis.config";
        ({ RedisConfig } = await import(modulePath));
    });

    beforeEach(() => {
        readFileSync.mockReset().mockImplementation((path) => `contents:${path}`);
    });

    describe("connection options", () => {
        it.each([
            ["buildCacheOptions", 0, 20],
            ["buildLimiterOptions", 2, 5],
            ["buildQueueOptions", 3, null],
        ] as const)("builds %s with its own database and request retry policy", (method, db, maxRetriesPerRequest) => {
            const options = RedisConfig[method](new ConfigService(values));
            expect(options).toMatchObject({
                host: "redis.internal",
                port: 6380,
                password: "secret",
                db,
                maxRetriesPerRequest,
                enableAutoPipelining: true,
                lazyConnect: true,
            });
            expect(options).not.toHaveProperty("tls");
            expect(readFileSync).not.toHaveBeenCalled();
        });

        it.each([
            ["buildCacheOptions", "REDIS_PASSWORD"],
            ["buildLimiterOptions", "REDIS_DB_LIMITER"],
            ["buildQueueOptions", "REDIS_DB_QUEUE"],
        ] as const)("requires configuration %s / %s", (method, key) => {
            expect(() => RedisConfig[method](new ConfigService({ ...values, [key]: undefined }))).toThrow(key);
        });
    });

    describe("buildLimiterOptions", () => {
        it("preserves database zero for the limiter", () => {
            const options = RedisConfig.buildLimiterOptions(new ConfigService({ ...values, REDIS_DB_LIMITER: 0 }));
            expect(options.db).toBe(0);
        });
    });

    describe("buildCacheOptions", () => {
        it.each([true, false])("loads TLS credentials and preserves rejectUnauthorized=%s", (rejectUnauthorized) => {
            const options = RedisConfig.buildCacheOptions(
                new ConfigService({
                    ...values,
                    ...tls,
                    REDIS_TLS_REJECT_UNAUTHORIZED: rejectUnauthorized,
                }),
            );
            expect(options.tls).toEqual({
                rejectUnauthorized,
                servername: "redis.internal",
                cert: "contents:/cert",
                key: "contents:/key",
                ca: "contents:/ca",
            });
            expect(readFileSync.mock.calls).toEqual([
                ["/cert", "utf8"],
                ["/key", "utf8"],
                ["/ca", "utf8"],
            ]);
        });

        it("propagates a certificate read error", () => {
            const error = new Error("certificate unavailable");
            readFileSync.mockImplementation(() => {
                throw error;
            });
            expect(() => RedisConfig.buildCacheOptions(new ConfigService({ ...values, ...tls }))).toThrow(error);
        });

        it.each([
            [0, 100],
            [1, 200],
            [4, 1600],
            [5, 2000],
            [20, 2000],
        ])("backs off attempt %s to %s milliseconds", (attempt, expected) => {
            const options = RedisConfig.buildCacheOptions(new ConfigService(values));
            expect(options.retryStrategy!(attempt)).toBe(expected);
        });

        it.each([
            ["READONLY You can't write against a read only replica.", true],
            ["READONLY replica", true],
            ["read only replica", true],
            ["Read Only replica", true],
            ["read ECONNRESET", true],
            ["econnreset", true],
            ["WRONGPASS invalid username-password pair", false],
            ["ERR unknown command", false],
            ["", false],
        ])("decides whether to reconnect after %s", (message, expected) => {
            const options = RedisConfig.buildCacheOptions(new ConfigService(values));
            expect(options.reconnectOnError!(new Error(message))).toBe(expected);
        });
    });

    describe("buildQueueOptions", () => {
        it("does not read certificates when TLS is explicitly disabled", () => {
            const options = RedisConfig.buildQueueOptions(
                new ConfigService({ ...values, ...tls, REDIS_TLS_ENABLED: false }),
            );
            expect(options).not.toHaveProperty("tls");
            expect(readFileSync).not.toHaveBeenCalled();
        });
    });
});
