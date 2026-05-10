import { EntitySchema } from "@mikro-orm/core";

import { ProjectionJournal } from "~common/transaction-manager/entities";
import { ProjectionJournalStatus } from "~context/enums";

export const ProjectionJournalSchema = new EntitySchema<ProjectionJournal>({
    class: ProjectionJournal,
    tableName: "projection_journal",
    schema: "system",

    indexes: [
        {
            name: "projection_journal_status_available_idx",
            properties: ["status", "availableAt", "createdAt"],
        },
        {
            name: "projection_journal_processing_lock_idx",
            properties: ["status", "lockedAt"],
        },
        {
            name: "projection_journal_applied_at_idx",
            properties: ["appliedAt"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        operationType: { type: "string", length: 128 },
        payload: { type: "jsonb" },

        status: { enum: true, items: () => ProjectionJournalStatus },
        attempts: { type: "int" },
        lastError: { type: "text", nullable: true },

        availableAt: { type: "timestamptz", length: 3 },
        lockedAt: { type: "timestamptz", length: 3, nullable: true },
        lockedBy: { type: "string", length: 128, nullable: true },

        appliedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
    },
});
