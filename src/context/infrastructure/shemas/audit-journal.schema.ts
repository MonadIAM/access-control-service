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
        id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },

        entity: { type: "uuid", nullable: false },
        realm: { type: "uuid", nullable: false },

        by: { type: "uuid", nullable: false },
        at: { type: "timestamptz", length: 3, nullable: false },

        reason: { type: "text", nullable: true, default: null },
        patch: { type: "jsonb", nullable: true, default: null },

        ip: { type: "text", nullable: true },
        userAgent: { type: "text", nullable: true },

        actionType: { enum: true, items: () => AccessControlActionType },
        entityType: { enum: true, items: () => AccessControlEntityType },

        createdAt: { type: "timestamptz", length: 3, defaultRaw: "now()", nullable: false },
    },
});
