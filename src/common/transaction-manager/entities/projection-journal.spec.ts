import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { ProjectionJournalStatus } from "~context/enums";

import { ProjectionJournal } from "./projection-journal.entity";

const BASE_PAYLOAD = { id: "00000000-0000-4000-8000-000000000001" };

function createJournal(overrides?: Partial<Entities.ProjectionJournal.ConstructorProps>): ProjectionJournal {
    return new ProjectionJournal({
        operationType: "ACCOUNT_CREATED",
        payload: BASE_PAYLOAD,
        ...overrides,
    });
}

describe("ProjectionJournal Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const journal = createJournal();

            expect(journal.operationType).toBe("ACCOUNT_CREATED");
            expect(journal.payload).toBe(BASE_PAYLOAD);
        });

        it("should auto-generate id and createdAt", () => {
            const journal = createJournal();

            expect(isUUID(journal.id, "4")).toBe(true);
            expect(journal.createdAt).toBeInstanceOf(Date);
        });

        it("should default status to PENDING", () => {
            const journal = createJournal();

            expect(journal.status).toBe(ProjectionJournalStatus.PENDING);
        });

        it("should default attempts to 0", () => {
            const journal = createJournal();

            expect(journal.attempts).toBe(0);
        });

        it("should default availableAt to current time when omitted", () => {
            const before = new Date();
            const journal = createJournal();

            expect(journal.availableAt).toBeInstanceOf(Date);
            expect(journal.availableAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });

        it("should use provided availableAt when supplied", () => {
            const future = new Date(Date.now() + 60000);
            const journal = createJournal({ availableAt: future });

            expect(journal.availableAt).toBe(future);
        });

        it("should leave optional fields undefined", () => {
            const journal = createJournal();

            expect(journal.lastError).toBeUndefined();
            expect(journal.lockedAt).toBeUndefined();
            expect(journal.lockedBy).toBeUndefined();
            expect(journal.appliedAt).toBeUndefined();
        });
    });
});
