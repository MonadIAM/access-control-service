import { EntitySchema } from "@mikro-orm/postgresql";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AuditJournal } from "~context/domain/entities";

export const AuditJournalSchema = new EntitySchema<AuditJournal>({
    class: AuditJournal,
    tableName: "audit_journal",
    schema: "access_control",

    indexes: [
        {
            name: "audit_journal_realm_idx",
            properties: ["realm"],
        },
        {
            name: "audit_journal_actor_created_at_idx",
            properties: ["actor", "createdAt"],
        },
        {
            name: "audit_journal_entity_type_action_idx",
            properties: ["entityType", "actionType"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        input: { type: "jsonb", nullable: true },
        realm: { type: "uuid", nullable: true },
        actor: { type: "uuid" },

        userAgent: { type: "text", nullable: true },
        ip: { type: "text", nullable: true },

        actionType: { enum: true, items: () => AccessControlActionType },
        entityType: { enum: true, items: () => AccessControlEntityType },

        createdAt: { type: "timestamptz", length: 3 },
    },
});
