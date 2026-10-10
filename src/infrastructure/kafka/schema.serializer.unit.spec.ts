import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { KafkaSchemaSerializer } from "./schema.serializer";

const encode = jest.fn<Kafka.SchemaRegistry.Encode.Signature>();
const registry: Kafka.SchemaRegistry.Contract = {
    encode,
    decode: <T>({ value }: Kafka.SchemaRegistry.Decode.Props): Promise<T> => Promise.resolve(value as T),
    validate: jest.fn<Kafka.SchemaRegistry.Validate.Signature>(),
};
const serializer = new KafkaSchemaSerializer(registry);

describe("[Utility] - KafkaSchemaSerializer", () => {
    beforeEach(() => {
        encode.mockReset();
    });

    describe("[Method] - serialize", () => {
        it.each([
            { label: "missing options", value: undefined },
            { label: "missing topic", value: {} },
            { label: "empty topic", value: { pattern: "" } },
            { label: "numeric topic", value: { pattern: 42 } },
        ])("[case] - uses plain serialization without a nonempty string topic ($label)", async ({ value: options }) => {
            // Arrange

            // Act
            const result = await serializer.serialize({ key: "id", value: { id: 1 } }, options);

            // Assert
            expect(result).toEqual({ key: "id", value: '{"id":1}', headers: {} });
            expect(encode).not.toHaveBeenCalled();
        });

        it("[case] - preserves the encoded buffer and message metadata", async () => {
            // Arrange
            const value = { id: 1 };
            const encoded = Buffer.from([0, 0, 0, 0, 1, 42]);
            encode.mockResolvedValue(encoded);
            const message = { key: "id", value, headers: { source: "test" }, partition: 2 };

            // Act
            const result = await serializer.serialize(message, { pattern: "events" });

            // Assert
            expect(encode).toHaveBeenCalledWith({ topic: "events", value });
            expect(result).toEqual({ ...message, value: encoded });
            expect(result.value).toBe(encoded);
            expect(message.value).toBe(value);
        });

        it("[case] - serializes JSON when the registry returns the original value", async () => {
            // Arrange
            const value = { id: 1 };
            encode.mockResolvedValue(value);

            // Act
            const result = await serializer.serialize({ value }, { pattern: "events" });

            // Assert
            expect(result).toEqual({
                value: '{"id":1}',
                headers: {},
            });
        });

        it("[case] - propagates registry failures", async () => {
            // Arrange
            const error = new Error("encoding failed");
            encode.mockRejectedValue(error);

            // Act
            const result = serializer.serialize({ value: {} }, { pattern: "events" });

            // Assert
            await expect(result).rejects.toBe(error);
        });
    });
});
