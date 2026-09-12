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

describe("Outbox Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const outbox = createOutbox();

            expect(outbox.actionType).toBe(AccessCacheTopicAction.INVALIDATE);
            expect(outbox.destinationTopic).toBe(KafkaTopic.ACCESS_CACHE);
            expect(outbox.payload).toBe(BASE_PAYLOAD);
        });

        it("should auto-generate id and createdAt", () => {
            const outbox = createOutbox();

            expect(isUUID(outbox.id, "4")).toBe(true);
            expect(outbox.createdAt).toBeInstanceOf(Date);
        });

        it("should assign optional metadata when provided", () => {
            const metadata = { traceId: "abc123" };
            const outbox = createOutbox({ metadata });

            expect(outbox.metadata).toBe(metadata);
        });

        it("should leave metadata undefined when omitted", () => {
            const outbox = createOutbox();

            expect(outbox.metadata).toBeUndefined();
        });
    });
});
