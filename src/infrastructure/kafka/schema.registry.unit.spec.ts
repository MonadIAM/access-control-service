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

describe("KafkaSchemaRegistry", () => {
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

    it.each([false, undefined])("passes values through when registry is disabled: %s", async (enabled) => {
        const service = create(enabled);
        await service.onApplicationBootstrap();
        expect(await service.encode({ topic, value })).toBe(value);
        expect(await service.decode({ topic, value: framed })).toBe(framed);
        expect(() => service.validate({ topic, value })).not.toThrow();
        expect(constructor).not.toHaveBeenCalled();
        expect(client.getLatestSchemaId).not.toHaveBeenCalled();
        expect(client.encode).not.toHaveBeenCalled();
        expect(client.decode).not.toHaveBeenCalled();
        expect(isValid).not.toHaveBeenCalled();
    });

    it("warms every topic and uses cached schema IDs for encoding", async () => {
        const service = create(true);
        await service.onApplicationBootstrap();
        expect(constructor).toHaveBeenCalledWith({ host: "http://registry" });
        expect(client.getLatestSchemaId.mock.calls.map(([subject]) => subject).sort()).toEqual(
            Object.values(KafkaTopic)
                .map((name) => `${name}-value`)
                .sort(),
        );
        expect(client.getSchema).toHaveBeenCalledWith(7);
        expect(await service.encode({ topic, value })).toBe(framed);
        expect(client.encode).toHaveBeenCalledWith(7, value);
        service.validate({ topic, value });
        expect(isValid).toHaveBeenCalledWith(value, { errorHook: expect.any(Function) });
    });

    it("accepts schema ID zero", async () => {
        client.getLatestSchemaId.mockResolvedValue(0);
        const service = create(true);
        await service.onApplicationBootstrap();
        await service.encode({ topic, value });
        expect(client.encode).toHaveBeenCalledWith(0, value);
    });

    it.each(["lookup", "schema"])(
        "keeps a subject unvalidated after a %s failure and warms other topics",
        async (stage) => {
            if (stage === "lookup") {
                client.getLatestSchemaId.mockRejectedValueOnce(new Error("missing"));
            } else {
                client.getSchema.mockRejectedValueOnce(new Error("unavailable"));
            }
            const service = create(true);
            await service.onApplicationBootstrap();
            expect(await service.encode({ topic, value })).toBe(value);
            service.validate({ topic, value });
            expect(isValid).not.toHaveBeenCalled();
            expect(client.encode).not.toHaveBeenCalled();
            const otherTopic = Object.values(KafkaTopic)[1];
            expect(await service.encode({ topic: otherTopic, value })).toBe(framed);
        },
    );

    it("passes unknown subjects through", async () => {
        const service = create(true);
        await service.onApplicationBootstrap();
        expect(await service.encode({ topic: "unknown-topic", value })).toBe(value);
        service.validate({ topic: "unknown-topic", value });
        expect(client.encode).not.toHaveBeenCalled();
        expect(isValid).not.toHaveBeenCalled();
    });

    it("decodes framed messages even without a warmed subject", async () => {
        const service = create(true);
        expect(await service.decode({ topic, value: framed })).toBe(value);
        expect(client.decode).toHaveBeenCalledWith(framed);
    });

    it.each([value, null, "json", Buffer.alloc(0), Buffer.from([1, 2])])(
        "passes unframed input through: %j",
        async (input) => {
            expect(await create(true).decode({ topic, value: input })).toBe(input);
            expect(client.decode).not.toHaveBeenCalled();
        },
    );

    it.each([new Error("upstream failed"), "unknown failure"])(
        "normalizes encoding and decoding errors: %s",
        async (error) => {
            const service = create(true);
            await service.onApplicationBootstrap();
            client.encode.mockRejectedValue(error);
            client.decode.mockRejectedValue(error);
            await expect(service.encode({ topic, value })).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.schema-registry.ENCODE_FAILED",
                params: { subject: `${topic}-value`, reason: error instanceof Error ? error.message : "encode failed" },
            });
            await expect(service.decode({ topic, value: framed })).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.schema-registry.DECODE_FAILED",
                params: { subject: `${topic}-value`, reason: error instanceof Error ? error.message : "decode failed" },
            });
        },
    );

    it("reports all invalid field paths", async () => {
        const service = create(true);
        await service.onApplicationBootstrap();
        isValid.mockImplementation((_value, { errorHook }) => {
            errorHook(["payload", "id"]);
            errorHook(["version"]);
            return false;
        });
        expect(() => service.validate({ topic, value })).toThrow(
            expect.objectContaining({
                statusCode: 422,
                messageKey: "services.schema-registry.MESSAGE_INVALID",
                params: { fields: "payload.id, version", subject: `${topic}-value` },
            }),
        );
    });
});
