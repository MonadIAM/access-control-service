import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { KafkaSchemaSerializer } from "./schema.serializer";

const encode = jest.fn<Kafka.SchemaRegistry.Encode.Signature>();
const registry: Kafka.SchemaRegistry.Contract = {
    encode,
    decode: <T>({ value }: Kafka.SchemaRegistry.Decode.Props): Promise<T> => Promise.resolve(value as T),
    validate: jest.fn<Kafka.SchemaRegistry.Validate.Signature>(),
};
const serializer = new KafkaSchemaSerializer(registry);

describe("KafkaSchemaSerializer", () => {
    beforeEach(() => {
        encode.mockReset();
    });

    it.each([undefined, {}, { pattern: "" }, { pattern: 42 }])(
        "uses plain serialization without a nonempty string topic: %j",
        async (options) => {
            const result = await serializer.serialize({ key: "id", value: { id: 1 } }, options);
            expect(result).toEqual({ key: "id", value: '{"id":1}', headers: {} });
            expect(encode).not.toHaveBeenCalled();
        },
    );

    it("preserves the encoded buffer and message metadata", async () => {
        const value = { id: 1 };
        const encoded = Buffer.from([0, 0, 0, 0, 1, 42]);
        encode.mockResolvedValue(encoded);
        const message = { key: "id", value, headers: { source: "test" }, partition: 2 };
        const result = await serializer.serialize(message, { pattern: "events" });
        expect(encode).toHaveBeenCalledWith({ topic: "events", value });
        expect(result).toEqual({ ...message, value: encoded });
        expect(result.value).toBe(encoded);
        expect(message.value).toBe(value);
    });

    it("serializes JSON when the registry returns the original value", async () => {
        const value = { id: 1 };
        encode.mockResolvedValue(value);
        expect(await serializer.serialize({ value }, { pattern: "events" })).toEqual({ value: '{"id":1}', headers: {} });
    });

    it("propagates registry failures", async () => {
        const error = new Error("encoding failed");
        encode.mockRejectedValue(error);
        await expect(serializer.serialize({ value: {} }, { pattern: "events" })).rejects.toBe(error);
    });
});
