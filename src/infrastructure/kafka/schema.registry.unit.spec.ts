import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import { KafkaTopic } from "@monadiam/shared";
import { Logger } from "@nestjs/common";

import type { KafkaSchemaRegistry as SchemaRegistry } from "./schema.registry";

const isValid = jest.fn<(value: unknown, options: { errorHook(path: string[]): void }) => boolean>();

const client = {
    getLatestSchemaId: jest.fn<(subject: string) => Promise<number>>(),
    getSchema: jest.fn<(id: number) => Promise<{ isValid: typeof isValid }>>(),
    encode: jest.fn<(id: number, value: unknown) => Promise<Buffer>>(),
    decode: jest.fn<(value: Buffer) => Promise<unknown>>(),
};

const constructor = jest.fn((_options: { host: string }) => client);

jest.unstable_mockModule("@kafkajs/confluent-schema-registry", () => ({ SchemaRegistry: constructor }));

let KafkaSchemaRegistry: typeof SchemaRegistry;
const topic = Object.values(KafkaTopic)[0];
const framed = Buffer.from([0, 0, 0, 0, 7, 42]);
const value = { id: 1 };

function create(enabled?: boolean): SchemaRegistry {
    return new KafkaSchemaRegistry(
        new ConfigService({ SCHEMA_REGISTRY_URL: "http://registry", SCHEMA_REGISTRY_ENABLED: enabled }),
    );
}

describe("[InfrastructureService] - KafkaSchemaRegistry", () => {
    beforeAll(async () => {
        const modulePath = "./schema.registry";
        ({ KafkaSchemaRegistry } = await import(modulePath));
    });

    beforeEach(() => {
        jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "debug").mockImplementation(() => {});
        client.getLatestSchemaId.mockReset().mockResolvedValue(7);
        client.getSchema.mockReset().mockResolvedValue({ isValid });
        client.encode.mockReset().mockResolvedValue(framed);
        client.decode.mockReset().mockResolvedValue(value);
        isValid.mockReset().mockReturnValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Behavior] - disabled registry", () => {
        it.each([false, undefined])("[case] - passes values through when registry is disabled: %s", async (enabled) => {
            // Arrange
            const service = create(enabled);
            await service.onApplicationBootstrap();

            // Act
            const result = await service.encode({ topic, value });
            const result2 = await service.decode({ topic, value: framed });
            const act = (): unknown => service.validate({ topic, value });

            // Assert
            expect(result).toBe(value);
            expect(result2).toBe(framed);
            expect(act).not.toThrow();
            expect(constructor).not.toHaveBeenCalled();
            expect(client.getLatestSchemaId).not.toHaveBeenCalled();
            expect(client.encode).not.toHaveBeenCalled();
            expect(client.decode).not.toHaveBeenCalled();
            expect(isValid).not.toHaveBeenCalled();
        });
    });

    describe("[Behavior] - schema warmup", () => {
        it("[case] - warms every topic and uses cached schema IDs for encoding", async () => {
            // Arrange
            const service = create(true);

            // Act
            await service.onApplicationBootstrap();
            const result = await service.encode({ topic, value });
            service.validate({ topic, value });

            // Assert
            expect(constructor).toHaveBeenCalledWith({ host: "http://registry" });
            expect(client.getLatestSchemaId.mock.calls.map(([subject]) => subject).sort()).toEqual(
                Object.values(KafkaTopic)
                    .map((name) => `${name}-value`)
                    .sort(),
            );
            expect(client.getSchema).toHaveBeenCalledWith(7);
            expect(result).toBe(framed);
            expect(client.encode).toHaveBeenCalledWith(7, value);
            expect(isValid).toHaveBeenCalledWith(value, { errorHook: expect.any(Function) });
        });

        it("[case] - accepts schema ID zero", async () => {
            // Arrange
            client.getLatestSchemaId.mockResolvedValue(0);
            const service = create(true);
            await service.onApplicationBootstrap();

            // Act
            await service.encode({ topic, value });

            // Assert
            expect(client.encode).toHaveBeenCalledWith(0, value);
        });

        it.each(["lookup", "schema"])(
            "[case] - keeps a subject unvalidated after a %s failure and warms other topics",
            async (stage) => {
                // Arrange
                if (stage === "lookup") {
                    client.getLatestSchemaId.mockRejectedValueOnce(new Error("missing"));
                } else {
                    client.getSchema.mockRejectedValueOnce(new Error("unavailable"));
                }
                const service = create(true);
                await service.onApplicationBootstrap();

                // Act
                const result = await service.encode({ topic, value });
                service.validate({ topic, value });
                const encodesBeforeOtherTopic = client.encode.mock.calls.length;
                const otherTopic = Object.values(KafkaTopic)[1];
                const result2 = await service.encode({ topic: otherTopic, value });

                // Assert
                expect(result).toBe(value);
                expect(isValid).not.toHaveBeenCalled();
                expect(encodesBeforeOtherTopic).toBe(0);
                expect(result2).toBe(framed);
            },
        );
    });

    describe("[Behavior] - unregistered subjects", () => {
        it("[case] - passes unknown subjects through", async () => {
            // Arrange
            const service = create(true);
            await service.onApplicationBootstrap();

            // Act
            const result = await service.encode({ topic: "unknown-topic", value });
            service.validate({ topic: "unknown-topic", value });

            // Assert
            expect(result).toBe(value);
            expect(client.encode).not.toHaveBeenCalled();
            expect(isValid).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - decode", () => {
        it("[case] - decodes framed messages even without a warmed subject", async () => {
            // Arrange
            const service = create(true);

            // Act
            const result = await service.decode({ topic, value: framed });

            // Assert
            expect(result).toBe(value);
            expect(client.decode).toHaveBeenCalledWith(framed);
        });

        it.each([
            { label: "object", value: value },
            { label: "null", value: null },
            { label: "string", value: "json" },
            { label: "empty buffer", value: Buffer.alloc(0) },
            { label: "unframed buffer", value: Buffer.from([1, 2]) },
        ])("[case] - passes unframed input through ($label)", async ({ value: input }) => {
            // Arrange

            // Act
            const result = await create(true).decode({ topic, value: input });

            // Assert
            expect(result).toBe(input);
            expect(client.decode).not.toHaveBeenCalled();
        });
    });

    describe("[Behavior] - schema round trip", () => {
        it.each([
            { label: "Error", value: new Error("upstream failed") },
            { label: "string", value: "unknown failure" },
        ])("[case] - normalizes encoding and decoding errors ($label)", async ({ value: error }) => {
            // Arrange
            const service = create(true);
            await service.onApplicationBootstrap();
            client.encode.mockRejectedValue(error);
            client.decode.mockRejectedValue(error);

            // Act
            const result = service.encode({ topic, value });
            await Promise.allSettled([result]);
            const result2 = service.decode({ topic, value: framed });

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.schema-registry.ENCODE_FAILED",
                params: { subject: `${topic}-value`, reason: error instanceof Error ? error.message : "encode failed" },
            });
            await expect(result2).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.schema-registry.DECODE_FAILED",
                params: { subject: `${topic}-value`, reason: error instanceof Error ? error.message : "decode failed" },
            });
        });
    });

    describe("[Method] - validate", () => {
        it("[case] - reports all invalid field paths", async () => {
            // Arrange
            const service = create(true);
            await service.onApplicationBootstrap();
            isValid.mockImplementation((_value, { errorHook }) => {
                errorHook(["payload", "id"]);
                errorHook(["version"]);
                return false;
            });

            // Act
            const act = (): unknown => service.validate({ topic, value });

            // Assert
            expect(act).toThrow(
                expect.objectContaining({
                    statusCode: 422,
                    messageKey: "services.schema-registry.MESSAGE_INVALID",
                    params: { fields: "payload.id, version", subject: `${topic}-value` },
                }),
            );
        });
    });
});
