import { describe, expect, it } from "@jest/globals";

import { KafkaIncomingMapper } from "./incoming.mapper";

function context(key: Nullable<Buffer>): Kafka.IncomingMapper.Context {
    return {
        getMessage: () => ({ key, value: null, offset: "42", timestamp: "0", attributes: 0, headers: {} }),
        getTopic: () => "events",
        getPartition: () => 3,
    };
}

const mapper = new KafkaIncomingMapper();

describe("KafkaIncomingMapper", () => {
    describe("map", () => {
        it("maps the event, consumer and source coordinates without converting the offset", () => {
            expect(mapper.map({ context: context(Buffer.from("событие")), consumerKey: "consumer" })).toEqual({
                event: "событие",
                consumerKey: "consumer",
                source: { topic: "events", partition: 3, offset: "42" },
            });
        });
    });

    describe("reference", () => {
        it("uses the message key as the reference", () => {
            expect(mapper.reference({ context: context(Buffer.from("event-id")) })).toBe("event-id");
        });
    });

    describe("reference / map", () => {
        it.each([null, Buffer.alloc(0)])("uses source coordinates for an absent or empty key: %s", (key) => {
            expect(mapper.reference({ context: context(key) })).toBe("events:3:42");
            expect(() => mapper.map({ context: context(key), consumerKey: "consumer" })).toThrow(
                expect.objectContaining({ statusCode: 422, messageKey: "services.kafka-incoming.EVENT_MISSING" }),
            );
        });
    });
});
