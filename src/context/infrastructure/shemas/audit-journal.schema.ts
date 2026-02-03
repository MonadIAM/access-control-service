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
            properties: ["entity", "entityId"],
        },
        {
            name: "audit_journal_realm_idx",
            properties: ["realmId"],
        },
        {
            name: "audit_journal_by_at_idx",
            properties: ["by", "at"],
        },
    ],

    properties: {
        id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },

        entityId: { type: "uuid", nullable: false },
        realmId: { type: "uuid", nullable: false },

        by: { type: "uuid", nullable: false },
        at: { type: "timestamptz", nullable: false },

        reason: { type: "text", nullable: true, default: null },
        patch: { type: "jsonb", nullable: true, default: null },

        ip: { type: "text", nullable: true },
        userAgent: { type: "text", nullable: true },

        action: { enum: true, items: () => AccessControlActionType },
        entity: { enum: true, items: () => AccessControlEntityType },

        createdAt: { type: "timestamptz", defaultRaw: "now()", nullable: false },
    },
});
