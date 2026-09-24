import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { InboxService } from "./inbox.service";
import { Inbox } from "../entities";

describe("InboxService integration", () => {
    const suite = postgresSuite({
        repository: () => new InboxService(),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("claims an event once per consumer", async () => {
        const incoming: TransactionManager.Service.IncomingMessage = {
            consumerKey: "access-control.account.v1",
            event: "event-1",
            source: { topic: "account", partition: 2, offset: "42" },
        };

        const first = await suite.transaction((transaction) => suite.repository().claim({ transaction, incoming }));
        const duplicate = await suite.transaction((transaction) => suite.repository().claim({ transaction, incoming }));
        const anotherConsumer = await suite.transaction((transaction) =>
            suite.repository().claim({
                transaction,
                incoming: { ...incoming, consumerKey: "access-control.membership.v1" },
            }),
        );

        const rows = await suite.transaction((transaction) =>
            transaction.find(Inbox, {}, { orderBy: { consumerKey: "asc" } }),
        );

        expect(first).toBe(true);
        expect(duplicate).toBe(false);
        expect(anotherConsumer).toBe(true);
        expect(rows).toHaveLength(2);
        expect(rows[0]).toEqual(
            expect.objectContaining({ event: "event-1", topic: "account", partition: 2, offset: "42" }),
        );
    });

    it("cleans one expired batch and keeps fresh entries", async () => {
        const events = ["expired-1", "expired-2", "expired-3", "fresh"];

        for await (const event of events) {
            await suite.transaction((transaction) =>
                suite.repository().claim({
                    transaction,
                    incoming: { consumerKey: "access-control.account.v1", event },
                }),
            );
        }

        await suite.transaction(async (transaction) => {
            const rows = await transaction.find(Inbox, {});
            for (const row of rows) {
                row.processedAt =
                    row.event === "fresh"
                        ? new Date("2999-01-01T00:00:00.000Z")
                        : new Date(`2026-01-0${Number(row.event.slice(-1))}T00:00:00.000Z`);
            }
        });

        const cleaned = await suite.transaction((transaction) =>
            suite.repository().clean({
                expirationDate: new Date("2026-02-01T00:00:00.000Z"),
                batchSize: 2,
                transaction,
            }),
        );
        const remaining = await suite.transaction((transaction) =>
            transaction.find(Inbox, {}, { orderBy: { processedAt: "asc" } }),
        );

        expect(cleaned).toBe(2);
        expect(remaining.map(({ event }) => event)).toEqual(["expired-3", "fresh"]);
    });
});
