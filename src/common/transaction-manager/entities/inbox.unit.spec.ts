import { describe, expect, it } from "@jest/globals";

import { Inbox } from "./inbox.entity";

describe("Inbox Entity", () => {
    it("stores the stable consumer and event identity", () => {
        const inbox = new Inbox({
            event: "00000000-0000-4000-8000-000000000001",
            consumerKey: "access-control.account.v1",
            source: {
                offset: "9007199254740993",
                topic: "account",
                partition: 1,
            },
        });

        expect(inbox).toEqual(
            expect.objectContaining({
                event: "00000000-0000-4000-8000-000000000001",
                consumerKey: "access-control.account.v1",
                processedAt: expect.any(Date),
                offset: "9007199254740993",
                topic: "account",
                partition: 1,
            }),
        );
    });

    it("leaves optional source metadata empty", () => {
        const inbox = new Inbox({ consumerKey: "access-control.membership.v1", event: "event-1" });

        expect(inbox.topic).toBeUndefined();
        expect(inbox.partition).toBeUndefined();
        expect(inbox.offset).toBeUndefined();
    });
});
