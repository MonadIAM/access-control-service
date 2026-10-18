import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import type { KafkaUtils as Utils } from "./utils";

const readFileSync = jest.fn<(path: string, encoding: string) => string>();
jest.unstable_mockModule("fs", () => ({ readFileSync }));
let KafkaUtils: typeof Utils;

const base = { SERVICE_NAME: "access-control", KAFKA_BROKER: "broker:9093" };
const ssl = {
    KAFKA_SSL_ENABLED: true,
    KAFKA_SSL_REJECT_UNAUTHORIZED: true,
    KAFKA_SSL_CA_FILE: "/ca",
};
const sasl = {
    KAFKA_SASL_ENABLED: true,
    KAFKA_SASL_PASSWORD_FILE: "/password",
    KAFKA_SASL_USERNAME: "service",
};

describe("[Utility] - KafkaUtils", () => {
    beforeAll(async () => {
        const modulePath = "./utils";
        ({ KafkaUtils } = await import(modulePath));
    });

    beforeEach(() => {
        readFileSync.mockReset().mockImplementation((path) => `contents:${path}`);
    });

    describe("[Method] - buildClientConfig", () => {
        it.each([false, true])("[case] - includes clientId only when requested: %s", (withClientId) => {
            // Arrange

            // Act
            const result = KafkaUtils.buildClientConfig(new ConfigService(base), { withClientId });

            // Assert
            expect(result).toEqual({
                brokers: ["broker:9093"],
                ...(withClientId ? { clientId: "access-control" } : {}),
            });
            expect(readFileSync).not.toHaveBeenCalled();
        });

        it("[case] - disables clientId and security by default", () => {
            // Arrange

            // Act
            const result = KafkaUtils.buildClientConfig(new ConfigService(base));

            // Assert
            expect(result).toEqual({ brokers: ["broker:9093"] });
        });

        it.each([false, true])("[case] - builds TLS options and preserves rejectUnauthorized=%s", (rejectUnauthorized) => {
            // Arrange
            const config = new ConfigService({ ...base, ...ssl, KAFKA_SSL_REJECT_UNAUTHORIZED: rejectUnauthorized });

            // Act
            const result = KafkaUtils.buildClientConfig(config);

            // Assert
            expect(result).toEqual({
                brokers: ["broker:9093"],
                ssl: {
                    ca: ["contents:/ca"],
                    rejectUnauthorized,
                },
            });
            expect(readFileSync.mock.calls).toEqual([["/ca", "utf8"]]);
        });

        it("[case] - combines TLS and SASL and trims the password file", () => {
            // Arrange
            readFileSync.mockImplementation((path) => (path === "/password" ? "  secret\n" : `contents:${path}`));

            // Act
            const result = KafkaUtils.buildClientConfig(new ConfigService({ ...base, ...ssl, ...sasl }));

            // Assert
            expect(result.ssl).not.toHaveProperty("servername");
            expect(result.sasl).toEqual({ mechanism: "scram-sha-512", username: "service", password: "secret" });
            expect(readFileSync).toHaveBeenCalledWith("/password", "utf8");
        });

        it("[case] - authenticates with SCRAM over CA-only TLS and lets KafkaJS select each broker hostname", () => {
            // Arrange
            const config = new ConfigService({
                ...base,
                ...ssl,
                ...sasl,
            });

            // Act
            const result = KafkaUtils.buildClientConfig(config);

            // Assert
            expect(result.ssl).toEqual({ ca: ["contents:/ca"], rejectUnauthorized: true });
            expect(result.sasl).toMatchObject({ mechanism: "scram-sha-512", username: "service" });
            expect(readFileSync.mock.calls).toEqual([
                ["/ca", "utf8"],
                ["/password", "utf8"],
            ]);
        });

        it("[case] - supports SASL without TLS", () => {
            // Arrange

            // Act
            const result = KafkaUtils.buildClientConfig(new ConfigService({ ...base, ...sasl }));

            // Assert
            expect(result).toEqual({
                brokers: ["broker:9093"],
                sasl: { mechanism: "scram-sha-512", username: "service", password: "contents:/password" },
            });
        });

        it("[case] - propagates secret file errors", () => {
            // Arrange
            const error = new Error("unreadable secret");
            readFileSync.mockImplementation(() => {
                throw error;
            });

            // Act
            const act = (): unknown => KafkaUtils.buildClientConfig(new ConfigService({ ...base, ...sasl }));

            // Assert
            expect(act).toThrow(error);
        });

        it("[case] - fails on missing required configuration", () => {
            // Arrange

            // Act
            const act = (): unknown => KafkaUtils.buildClientConfig(new ConfigService({ SERVICE_NAME: "service" }));

            // Assert
            expect(act).toThrow("KAFKA_BROKER");
        });
    });
});
