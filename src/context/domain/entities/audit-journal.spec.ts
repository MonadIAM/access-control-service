import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

import { AuditJournal } from "./audit-journal.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function createJournal(overrides?: Partial<Entities.AuditJournal.ConstructorProps>): AuditJournal {
    return new AuditJournal({
        actionType: AccessControlActionType.CREATE,
        entityType: AccessControlEntityType.ROLE,
        at: new Date("2025-01-01T00:00:00Z"),
        entity: "entity-id",
        by: ACTOR_ID,
        ...overrides,
    });
}

describe("AuditJournal Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const at = new Date("2025-06-01T12:00:00Z");

            const journal = createJournal({
                actionType: AccessControlActionType.CREATE,
                entityType: AccessControlEntityType.PERMISSION,
                entity: "perm-123",
                by: ACTOR_ID,
                at,
            });

            expect(journal.actionType).toBe(AccessControlActionType.CREATE);
            expect(journal.entityType).toBe(AccessControlEntityType.PERMISSION);
            expect(journal.entity).toBe("perm-123");
            expect(journal.by).toBe(ACTOR_ID);
            expect(journal.at).toBe(at);
        });

        it("should auto-generate id and createdAt", () => {
            const journal = createJournal();

            expect(isUUID(journal.id, "4")).toBe(true);
            expect(journal.createdAt).toBeInstanceOf(Date);
        });

        it("should assign optional fields when provided", () => {
            const patch = { name: { old: "A", new: "B" } };

            const journal = createJournal({
                realm: "realm-id",
                ip: "127.0.0.1",
                userAgent: "Mozilla/5.0",
                patch,
                reason: "audit trail",
            });

            expect(journal.realm).toBe("realm-id");
            expect(journal.ip).toBe("127.0.0.1");
            expect(journal.userAgent).toBe("Mozilla/5.0");
            expect(journal.patch).toBe(patch);
            expect(journal.reason).toBe("audit trail");
        });

        it("should leave optional fields undefined when omitted", () => {
            const journal = createJournal();

            expect(journal.realm).toBeUndefined();
            expect(journal.ip).toBeUndefined();
            expect(journal.userAgent).toBeUndefined();
            expect(journal.patch).toBeUndefined();
            expect(journal.reason).toBeUndefined();
        });
    });
});
