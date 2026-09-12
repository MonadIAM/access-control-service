import { EntitySchema } from "@mikro-orm/postgresql";

import { AuditLog } from "~common/transaction-manager/entities";

export const AuditLogSchema = new EntitySchema<AuditLog>({
    class: AuditLog,
    tableName: "audit_log",
    schema: "system",

    indexes: [
        {
            name: "audit_log_realm_idx",
            properties: ["realm"],
        },
        {
            name: "audit_log_actor_created_at_idx",
            properties: ["actor", "createdAt"],
        },
        {
            name: "audit_log_entity_type_action_type_idx",
            properties: ["entityType", "actionType"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        actionType: { type: "string", length: 64 },
        entityType: { type: "string", length: 64 },

        realm: { type: "uuid", nullable: true },
        actor: { type: "uuid", nullable: true },

        ip: { type: "text", columnType: "inet", nullable: true },
        userAgent: { type: "text", nullable: true },

        input: { type: "jsonb", nullable: true },

        signature: { type: "text" },
        keyVersion: { type: "integer" },

        createdAt: { type: "timestamptz", length: 3 },
    },
});
