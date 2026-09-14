import { EntitySchema } from "@mikro-orm/postgresql";

import { Inbox } from "~common/transaction-manager/entities";

export const InboxSchema = new EntitySchema<Inbox>({
    class: Inbox,
    tableName: "inbox",
    schema: "system",

    indexes: [
        {
            name: "inbox_processed_at_idx",
            properties: ["processedAt"],
        },
    ],

    properties: {
        consumerKey: { primary: true, type: "text" },
        event: { primary: true, type: "text" },

        partition: { type: "integer", nullable: true },
        offset: { type: "text", nullable: true },
        topic: { type: "text", nullable: true },

        processedAt: { type: "timestamptz", length: 3 },
    },
});
