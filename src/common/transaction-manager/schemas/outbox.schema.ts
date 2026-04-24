import { EntitySchema } from "@mikro-orm/core";

import { Outbox } from "~common/transaction-manager/entities";

export const OutboxSchema = new EntitySchema<Outbox>({
    class: Outbox,
    tableName: "outbox",
    schema: "system",

    indexes: [
        {
            name: "outbox_sequence_number_idx",
            properties: ["sequenceNumber"],
        },
        {
            name: "outbox_aggregate_idx",
            properties: ["aggregateType"],
        },
        {
            name: "outbox_ttl_expires_at_idx",
            properties: ["ttlExpiresAt"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        sequenceNumber: { type: "bigint", serializedPrimaryKey: false, autoincrement: true },

        eventType: { type: "string", length: 64 },
        aggregateType: { type: "string", length: 64 },
        destinationTopic: { type: "string", length: 128 },

        payload: { type: "jsonb" },
        metadata: { type: "jsonb", nullable: true },

        createdAt: { type: "timestamptz", length: 3 },
        ttlExpiresAt: { type: "timestamptz", length: 3, nullable: true },
    },
});
