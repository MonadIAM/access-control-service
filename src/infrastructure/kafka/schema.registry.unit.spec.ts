import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Client, JsonDeserializer, JsonSerializer, SchemaRegistryClient, SerdeType } from "@confluentinc/schemaregistry";
import { ConfigService } from "@nestjs/config";
import { KafkaTopic } from "@monadiam/shared";
import { Logger } from "@nestjs/common";

import { Exception } from "~common/exceptions";

import { KafkaSchemaRegistry } from "./schema.registry";

const topic = Object.values(KafkaTopic)[0];
const value = { id: "event", version: 1 };
const schema = {
    schemaType: "JSON",
    schema: JSON.stringify({
        type: "object",
        required: ["id", "version"],
        properties: { id: { type: "string" }, version: { type: "integer" } },
    }),
};

function create(enabled?: boolean): KafkaSchemaRegistry {
    return new KafkaSchemaRegistry(
        new ConfigService({ SCHEMA_REGISTRY_URL: "http://registry", SCHEMA_REGISTRY_ENABLED: enabled }),
    );
}

describe("[InfrastructureService] - KafkaSchemaRegistry", () => {
    let client: Client;

    beforeEach(async () => {
        jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "debug").mockImplementation(() => {});
        client = SchemaRegistryClient.newClient({ baseURLs: ["mock://registry"] });
        await client.register(`${topic}-value`, schema, false);
        jest.spyOn(SchemaRegistryClient, "newClient").mockReturnValue(client);
    });

    afterEach(async () => {
        await client.close();
        jest.restoreAllMocks();
    });

    describe("[Behavior] - disabled registry", () => {
        it.each([false, undefined])("[case] - passes values through when registry is disabled: %s", async (enabled) => {
            // Arrange
            const service = create(enabled);

            // Act
            await service.onApplicationBootstrap();
            const encoded = await service.encode({ topic, value });
            const decoded = await service.decode({ topic, value });
            const validate = (): void => service.validate({ topic, value });

            // Assert
            expect(encoded).toBe(value);
            expect(decoded).toBe(value);
            expect(validate).not.toThrow();
            expect(SchemaRegistryClient.newClient).not.toHaveBeenCalled();
        });
    });

    describe("[Behavior] - schema warmup", () => {
        it("[case] - warms topic validators and delegates JSON framing to the serializer", async () => {
            // Arrange
            const lookup = jest.spyOn(client, "getLatestSchemaMetadata");
            const associations = jest.spyOn(client, "getAssociationsByResourceName");
            const service = create(true);

            // Act
            await service.onApplicationBootstrap();
            const topics = lookup.mock.calls.map(([subject]) => subject);
            const encoded = await service.encode({ topic, value });
            const decoded = await service.decode({ topic, value: encoded });

            // Assert
            expect(SchemaRegistryClient.newClient).toHaveBeenCalledWith({ baseURLs: ["http://registry"] });
            expect(associations).not.toHaveBeenCalled();
            expect(topics.sort()).toEqual(
                Object.values(KafkaTopic)
                    .map((name) => `${name}-value`)
                    .sort(),
            );
            expect(Buffer.isBuffer(encoded)).toBe(true);
            expect(decoded).toEqual(value);
            expect(() => service.validate({ topic, value })).not.toThrow();
        });

        it("[case] - accepts schema ID zero", async () => {
            // Arrange
            jest.spyOn(client, "getLatestSchemaMetadata").mockResolvedValue({ ...schema, id: 0, version: 1 });
            const service = create(true);
            await service.onApplicationBootstrap();

            // Act
            const encoded = await service.encode({ topic, value });

            // Assert
            expect(Buffer.isBuffer(encoded) && encoded.readUInt32BE(1)).toBe(0);
        });

        it.each(["lookup", "schema"])("[case] - preserves fallback after a %s failure", async (stage) => {
            // Arrange
            const otherTopic = Object.values(KafkaTopic)[1];
            await client.register(`${otherTopic}-value`, schema, false);
            const error = Exception.externalServiceFailed({ messageKey: "temporary" });
            if (stage === "lookup") {
                jest.spyOn(client, "getLatestSchemaMetadata").mockRejectedValueOnce(error);
            } else {
                jest.spyOn(JsonSerializer.prototype, "toValidateFunction").mockRejectedValueOnce(error);
            }
            const service = create(true);

            // Act
            await service.onApplicationBootstrap();
            const encoded = await service.encode({ topic, value });
            const other = await service.encode({ topic: otherTopic, value });

            // Assert
            expect(encoded).toBe(value);
            expect(Buffer.isBuffer(other)).toBe(true);
            expect(() => service.validate({ topic, value: {} })).not.toThrow();
        });
    });

    describe("[Method] - decode", () => {
        it("[case] - decodes and validates framed JSON without a warmed subject", async () => {
            // Arrange
            const serializer = new JsonSerializer(client, SerdeType.VALUE, { useLatestVersion: true, validate: true });
            const encoded = await serializer.serialize(topic, value);
            const service = create(true);

            // Act
            const decoded = await service.decode({ topic, value: encoded });

            // Assert
            expect(decoded).toEqual(value);
        });

        it.each([value, null, "json", Buffer.alloc(0), Buffer.from([1, 2])])(
            "[case] - passes unframed input through: %s",
            async (input) => {
                // Arrange
                const service = create(true);

                // Act
                const decoded = await service.decode({ topic, value: input });

                // Assert
                expect(decoded).toBe(input);
            },
        );

        it("[case] - rejects a framed payload that violates its writer schema", async () => {
            // Arrange
            const serializer = new JsonSerializer(client, SerdeType.VALUE, { useLatestVersion: true, validate: false });
            const encoded = await serializer.serialize(topic, { id: 12 });
            const service = create(true);

            // Act
            const result = service.decode({ topic, value: encoded });

            // Assert
            await expect(result).rejects.toMatchObject({ messageKey: "services.schema-registry.DECODE_FAILED" });
        });
    });

    describe("[Behavior] - schema errors", () => {
        it.each([Exception.externalServiceFailed({ messageKey: "temporary" }), "unknown failure"])(
            "[case] - normalizes serialization failures: %s",
            async (error) => {
                // Arrange
                const service = create(true);
                await service.onApplicationBootstrap();
                jest.spyOn(JsonSerializer.prototype, "serialize").mockRejectedValue(error);
                jest.spyOn(JsonDeserializer.prototype, "deserialize").mockRejectedValue(error);

                // Act
                const encoded = service.encode({ topic, value });
                const decoded = service.decode({ topic, value: Buffer.from([0, 0, 0, 0, 1]) });

                // Assert
                await expect(encoded).rejects.toMatchObject({ messageKey: "services.schema-registry.ENCODE_FAILED" });
                await expect(decoded).rejects.toMatchObject({ messageKey: "services.schema-registry.DECODE_FAILED" });
            },
        );
    });

    describe("[Method] - validate", () => {
        it("[case] - reports every invalid field using the compiled validator", async () => {
            // Arrange
            const service = create(true);
            await service.onApplicationBootstrap();

            // Act
            const validate = (): void => service.validate({ topic, value: { id: 12, version: "wrong" } });

            // Assert
            expect(validate).toThrow(
                expect.objectContaining({
                    statusCode: 422,
                    messageKey: "services.schema-registry.MESSAGE_INVALID",
                    params: { fields: "/id, /version", subject: `${topic}-value` },
                }),
            );
        });

        it("[case] - preserves UUID format validation", async () => {
            // Arrange
            await client.register(
                `${topic}-value`,
                {
                    schemaType: "JSON",
                    schema: JSON.stringify({ type: "object", properties: { id: { type: "string", format: "uuid" } } }),
                },
                false,
            );
            const service = create(true);
            await service.onApplicationBootstrap();

            // Act
            const validate = (): void => service.validate({ topic, value: { id: "invalid" } });
            const encoded = service.encode({ topic, value: { id: "invalid" } });

            // Assert
            expect(validate).toThrow(expect.objectContaining({ messageKey: "services.schema-registry.MESSAGE_INVALID" }));
            await expect(encoded).rejects.toMatchObject({ messageKey: "services.schema-registry.ENCODE_FAILED" });
        });
    });

    describe("[Method] - onApplicationShutdown", () => {
        it("[case] - closes the shared registry client", async () => {
            // Arrange
            const close = jest.spyOn(client, "close");
            const service = create(true);

            // Act
            await service.onApplicationShutdown();

            // Assert
            expect(close).toHaveBeenCalledTimes(1);
        });
    });
});
