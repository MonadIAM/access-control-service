import { BigIntType, EntitySchema } from "@mikro-orm/postgresql";

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
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        sequenceNumber: { type: new BigIntType("number"), serializedPrimaryKey: false, autoincrement: true },

        actionType: { type: "string", length: 64 },
        destinationTopic: { type: "string", length: 128 },

        payload: { type: "jsonb" },
        metadata: { type: "jsonb", nullable: true },

        createdAt: { type: "timestamptz", length: 3 },
    },
});
