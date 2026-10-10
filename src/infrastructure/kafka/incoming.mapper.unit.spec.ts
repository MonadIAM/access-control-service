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

describe("[DataMapper] - KafkaIncoming", () => {
    describe("[Method] - map", () => {
        it("[case] - maps the event, consumer and source coordinates without converting the offset", () => {
            // Arrange

            // Act

            const result = mapper.map({ context: context(Buffer.from("событие")), consumerKey: "consumer" });

            // Assert
            expect(result).toEqual({
                event: "событие",
                consumerKey: "consumer",
                source: { topic: "events", partition: 3, offset: "42" },
            });
        });
    });

    describe("[Method] - reference", () => {
        it("[case] - uses the message key as the reference", () => {
            // Arrange

            // Act
            const result = mapper.reference({ context: context(Buffer.from("event-id")) });

            // Assert
            expect(result).toBe("event-id");
        });
    });

    describe("[Behavior] - event references", () => {
        it.each([
            { label: "absent key", value: null },
            { label: "empty key", value: Buffer.alloc(0) },
        ])("[case] - uses source coordinates for an absent or empty key ($label)", ({ value: key }) => {
            // Arrange

            // Act
            const result = mapper.reference({ context: context(key) });
            const act = (): unknown => mapper.map({ context: context(key), consumerKey: "consumer" });

            // Assert
            expect(result).toBe("events:3:42");
            expect(act).toThrow(
                expect.objectContaining({ statusCode: 422, messageKey: "services.kafka-incoming.EVENT_MISSING" }),
            );
        });
    });
});
