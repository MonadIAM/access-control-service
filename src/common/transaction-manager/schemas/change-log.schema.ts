import { EntitySchema } from "@mikro-orm/postgresql";

import { ChangeLog } from "~common/transaction-manager/entities";

export const ChangeLogSchema = new EntitySchema<ChangeLog>({
    class: ChangeLog,
    tableName: "change_log",
    schema: "system",

    indexes: [
        {
            name: "change_log_audit_entry_idx",
            properties: ["auditEntry"],
        },
        {
            name: "change_log_entity_type_entity_id_idx",
            properties: ["entityType", "entity"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        auditEntry: { type: "uuid", fieldName: "audit_entry_id" },

        changeType: { type: "string", length: 16 },
        entityType: { type: "string", length: 64 },
        entity: { type: "text" },

        delta: { type: "jsonb" },

        signature: { type: "text" },
        keyVersion: { type: "integer" },

        createdAt: { type: "timestamptz", length: 3 },
    },
});
