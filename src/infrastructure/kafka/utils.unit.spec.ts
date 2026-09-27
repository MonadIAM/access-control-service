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
    KAFKA_SSL_CERT_FILE: "/cert",
    KAFKA_SSL_KEY_FILE: "/key",
    KAFKA_SSL_CA_FILE: "/ca",
};
const sasl = {
    KAFKA_SASL_ENABLED: true,
    KAFKA_SASL_PASSWORD_FILE: "/password",
    KAFKA_SASL_USERNAME: "service",
};

describe("KafkaUtils", () => {
    beforeAll(async () => {
        const modulePath = "./utils";
        ({ KafkaUtils } = await import(modulePath));
    });

    beforeEach(() => {
        readFileSync.mockReset().mockImplementation((path) => `contents:${path}`);
    });

    describe("buildClientConfig", () => {
        it.each([false, true])("includes clientId only when requested: %s", (withClientId) => {
            expect(KafkaUtils.buildClientConfig(new ConfigService(base), { withClientId })).toEqual({
                brokers: ["broker:9093"],
                ...(withClientId ? { clientId: "access-control" } : {}),
            });
            expect(readFileSync).not.toHaveBeenCalled();
        });

        it("disables clientId and security by default", () => {
            expect(KafkaUtils.buildClientConfig(new ConfigService(base))).toEqual({ brokers: ["broker:9093"] });
        });

        it.each([false, true])("builds TLS options and preserves rejectUnauthorized=%s", (rejectUnauthorized) => {
            const config = new ConfigService({ ...base, ...ssl, KAFKA_SSL_REJECT_UNAUTHORIZED: rejectUnauthorized });
            expect(KafkaUtils.buildClientConfig(config)).toEqual({
                brokers: ["broker:9093"],
                ssl: {
                    servername: "broker",
                    cert: "contents:/cert",
                    key: "contents:/key",
                    ca: ["contents:/ca"],
                    rejectUnauthorized,
                },
            });
            expect(readFileSync.mock.calls).toEqual([
                ["/cert", "utf8"],
                ["/ca", "utf8"],
                ["/key", "utf8"],
            ]);
        });

        it("combines TLS and SASL and trims the password file", () => {
            readFileSync.mockImplementation((path) => (path === "/password" ? "  secret\n" : `contents:${path}`));
            const result = KafkaUtils.buildClientConfig(new ConfigService({ ...base, ...ssl, ...sasl }));
            expect(result.ssl).toMatchObject({ servername: "broker" });
            expect(result.sasl).toEqual({ mechanism: "scram-sha-512", username: "service", password: "secret" });
            expect(readFileSync).toHaveBeenCalledWith("/password", "utf8");
        });

        it("supports SASL without TLS", () => {
            expect(KafkaUtils.buildClientConfig(new ConfigService({ ...base, ...sasl }))).toEqual({
                brokers: ["broker:9093"],
                sasl: { mechanism: "scram-sha-512", username: "service", password: "contents:/password" },
            });
        });

        it("propagates secret file errors", () => {
            const error = new Error("unreadable secret");
            readFileSync.mockImplementation(() => {
                throw error;
            });
            expect(() => KafkaUtils.buildClientConfig(new ConfigService({ ...base, ...sasl }))).toThrow(error);
        });

        it("fails on missing required configuration", () => {
            expect(() => KafkaUtils.buildClientConfig(new ConfigService({ SERVICE_NAME: "service" }))).toThrow(
                "KAFKA_BROKER",
            );
        });
    });
});
