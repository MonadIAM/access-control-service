import { Injectable, Scope } from "@nestjs/common";

import { kysely } from "~infrastructure/database/utils/kysely-builder";

import { Inbox } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class InboxService implements TransactionManager.Inbox.Contract {
    public async claim(props: TransactionManager.Inbox.Claim.Props): TransactionManager.Inbox.Claim.Result {
        const { transaction, incoming } = props;
        const entity = new Inbox({
            consumerKey: incoming.consumerKey,
            source: incoming.source,
            event: incoming.event,
        });

        const query = kysely
            .insertInto("system.inbox")
            .values({
                processed_at: entity.processedAt,
                consumer_key: entity.consumerKey,
                partition: entity.partition,
                offset: entity.offset,
                topic: entity.topic,
                event: entity.event,
            })
            .onConflict((conflict) => conflict.columns(["consumer_key", "event"]).doNothing())
            .returning("event")
            .compile();

        const rows = await transaction.execute<TransactionManager.Inbox.Claim.Row[]>(
            query.sql,
            [...query.parameters],
            "all",
        );

        return rows.length === 1;
    }

    public async clean(props: TransactionManager.Inbox.Clean.Props): TransactionManager.Inbox.Clean.Result {
        const { transaction, expirationDate, batchSize } = props;
        const expired = kysely
            .selectFrom("system.inbox")
            .select(["consumer_key", "event"])
            .where("processed_at", "<", expirationDate)
            .orderBy("processed_at")
            .limit(batchSize)
            .$asTuple("consumer_key", "event");

        const query = kysely
            .deleteFrom("system.inbox")
            .where(({ eb, refTuple }) => eb(refTuple("consumer_key", "event"), "in", expired))
            .returning(["consumer_key", "event"])
            .compile();

        const rows = await transaction.execute<TransactionManager.Inbox.Clean.Row[]>(
            query.sql,
            [...query.parameters],
            "all",
        );

        return rows.length;
    }
}
