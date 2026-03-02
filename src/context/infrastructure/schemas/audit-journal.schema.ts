import { EntitySchema } from "@mikro-orm/postgresql";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AuditJournal } from "~context/domain/entities";

export const AuditJournalSchema = new EntitySchema<AuditJournal>({
    class: AuditJournal,
    tableName: "audit_journal",
    schema: "access_control",

    indexes: [
        {
            name: "audit_journal_entity_idx",
            properties: ["entityType", "entity"],
        },
        {
            name: "audit_journal_realm_idx",
            properties: ["realm"],
        },
        {
            name: "audit_journal_by_at_idx",
            properties: ["by", "at"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        realm: { type: "uuid", nullable: true },
        entity: { type: "uuid" },

        by: { type: "uuid" },
        at: { type: "timestamptz", length: 3 },

        reason: { type: "text", nullable: true },
        patch: { type: "jsonb", nullable: true },

        ip: { type: "text", nullable: true },
        userAgent: { type: "text", nullable: true },

        actionType: { enum: true, items: () => AccessControlActionType },
        entityType: { enum: true, items: () => AccessControlEntityType },

        createdAt: { type: "timestamptz", length: 3 },
    },
});
