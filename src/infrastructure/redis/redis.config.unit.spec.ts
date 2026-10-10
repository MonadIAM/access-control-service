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

describe("[Config] - Redis", () => {
    beforeAll(async () => {
        const modulePath = "./redis.config";
        ({ RedisConfig } = await import(modulePath));
    });

    beforeEach(() => {
        readFileSync.mockReset().mockImplementation((path) => `contents:${path}`);
    });

    describe("[Behavior] - connection options", () => {
        it.each([
            ["buildCacheOptions", 0, 20],
            ["buildLimiterOptions", 2, 5],
            ["buildQueueOptions", 3, null],
        ] as const)(
            "[case] - builds %s with its own database and request retry policy",
            (method, db, maxRetriesPerRequest) => {
                // Arrange

                // Act
                const options = RedisConfig[method](new ConfigService(values));

                // Assert
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
            },
        );

        it.each([
            ["buildCacheOptions", "REDIS_PASSWORD"],
            ["buildLimiterOptions", "REDIS_DB_LIMITER"],
            ["buildQueueOptions", "REDIS_DB_QUEUE"],
        ] as const)("[case] - requires configuration %s / %s", (method, key) => {
            // Arrange

            // Act
            const act = (): unknown => RedisConfig[method](new ConfigService({ ...values, [key]: undefined }));

            // Assert
            expect(act).toThrow(key);
        });
    });

    describe("[Method] - buildLimiterOptions", () => {
        it("[case] - preserves database zero for the limiter", () => {
            // Arrange

            // Act
            const options = RedisConfig.buildLimiterOptions(new ConfigService({ ...values, REDIS_DB_LIMITER: 0 }));

            // Assert
            expect(options.db).toBe(0);
        });
    });

    describe("[Method] - buildCacheOptions", () => {
        it.each([true, false])(
            "[case] - loads TLS credentials and preserves rejectUnauthorized=%s",
            (rejectUnauthorized) => {
                // Arrange

                // Act
                const options = RedisConfig.buildCacheOptions(
                    new ConfigService({
                        ...values,
                        ...tls,
                        REDIS_TLS_REJECT_UNAUTHORIZED: rejectUnauthorized,
                    }),
                );

                // Assert
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
            },
        );

        it("[case] - propagates a certificate read error", () => {
            // Arrange
            const error = new Error("certificate unavailable");
            readFileSync.mockImplementation(() => {
                throw error;
            });

            // Act
            const act = (): unknown => RedisConfig.buildCacheOptions(new ConfigService({ ...values, ...tls }));

            // Assert
            expect(act).toThrow(error);
        });

        it.each([
            [0, 100],
            [1, 200],
            [4, 1600],
            [5, 2000],
            [20, 2000],
        ])("[case] - backs off attempt %s to %s milliseconds", (attempt, expected) => {
            // Arrange

            // Act
            const options = RedisConfig.buildCacheOptions(new ConfigService(values));

            const result = options.retryStrategy!(attempt);

            // Assert
            expect(result).toBe(expected);
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
        ])("[case] - decides whether to reconnect after %s", (message, expected) => {
            // Arrange

            // Act
            const options = RedisConfig.buildCacheOptions(new ConfigService(values));

            const result = options.reconnectOnError!(new Error(message));

            // Assert
            expect(result).toBe(expected);
        });
    });

    describe("[Method] - buildQueueOptions", () => {
        it("[case] - does not read certificates when TLS is explicitly disabled", () => {
            // Arrange

            // Act
            const options = RedisConfig.buildQueueOptions(
                new ConfigService({ ...values, ...tls, REDIS_TLS_ENABLED: false }),
            );

            // Assert
            expect(options).not.toHaveProperty("tls");
            expect(readFileSync).not.toHaveBeenCalled();
        });
    });
});
