import { AccessCacheTopicAction } from "@monadiam/shared";
import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { KafkaTopic } from "~context/enums";

import { Outbox } from "./outbox.entity";

const BASE_PAYLOAD = { id: "00000000-0000-4000-8000-000000000001" };

function createOutbox(overrides?: Partial<SystemEntities.Outbox.ConstructorProps>): Outbox {
    return new Outbox({
        destinationTopic: KafkaTopic.ACCESS_CACHE,
        actionType: AccessCacheTopicAction.INVALIDATE,
        payload: BASE_PAYLOAD,
        ...overrides,
    });
}

describe("[Entity] - Outbox", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange

            // Act
            const outbox = createOutbox();

            // Assert
            expect(outbox.actionType).toBe(AccessCacheTopicAction.INVALIDATE);
            expect(outbox.destinationTopic).toBe(KafkaTopic.ACCESS_CACHE);
            expect(outbox.payload).toBe(BASE_PAYLOAD);
        });

        it("[case] - generates id and createdAt", () => {
            // Arrange

            // Act
            const outbox = createOutbox();

            const result = isUUID(outbox.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(outbox.createdAt).toBeInstanceOf(Date);
        });

        it("[case] - assigns optional metadata when provided", () => {
            // Arrange
            const metadata = { traceId: "abc123" };

            // Act
            const outbox = createOutbox({ metadata });

            // Assert
            expect(outbox.metadata).toBe(metadata);
        });

        it("[case] - leaves metadata undefined when omitted", () => {
            // Arrange

            // Act
            const outbox = createOutbox();

            // Assert
            expect(outbox.metadata).toBeUndefined();
        });
    });
});
