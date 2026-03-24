import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

import { AuditJournal } from "./audit-journal.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function createJournal(overrides?: Partial<Entities.AuditJournal.ConstructorProps>): AuditJournal {
    return new AuditJournal({
        actionType: AccessControlActionType.CREATE,
        entityType: AccessControlEntityType.ROLE,
        actor: ACTOR_ID,
        ...overrides,
    });
}

describe("AuditJournal Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const journal = createJournal({
                actionType: AccessControlActionType.CREATE,
                entityType: AccessControlEntityType.PERMISSION,
                actor: ACTOR_ID,
            });

            expect(journal.actionType).toBe(AccessControlActionType.CREATE);
            expect(journal.entityType).toBe(AccessControlEntityType.PERMISSION);
            expect(journal.actor).toBe(ACTOR_ID);
        });

        it("should auto-generate id and createdAt", () => {
            const journal = createJournal();

            expect(isUUID(journal.id, "4")).toBe(true);
            expect(journal.createdAt).toBeInstanceOf(Date);
        });

        it("should assign optional fields when provided", () => {
            const input = { identifiers: ["a1", "a2"], reason: "audit trail" };

            const journal = createJournal({
                realm: "realm-id",
                ip: "127.0.0.1",
                userAgent: "Mozilla/5.0",
                input,
            });

            expect(journal.realm).toBe("realm-id");
            expect(journal.ip).toBe("127.0.0.1");
            expect(journal.userAgent).toBe("Mozilla/5.0");
            expect(journal.input).toBe(input);
        });

        it("should leave optional fields undefined when omitted", () => {
            const journal = createJournal();

            expect(journal.realm).toBeUndefined();
            expect(journal.ip).toBeUndefined();
            expect(journal.userAgent).toBeUndefined();
            expect(journal.input).toBeUndefined();
        });
    });
});
