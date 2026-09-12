import { ChangeSetType } from "@mikro-orm/postgresql";
import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { ChangeLog } from "./change-log.entity";

const AUDIT_ENTRY_ID = "00000000-0000-4000-8000-000000000001";
const ENTITY_ID = "00000000-0000-4000-8000-000000000002";

const BASE_DELTA: ValueObjects.DeltaChanges.Contract = {
    name: { old: "Old Name", new: "New Name" },
};

function createChangeLog(overrides?: Partial<SystemEntities.ChangeLog.ConstructorProps>): ChangeLog {
    return new ChangeLog({
        changeType: ChangeSetType.UPDATE,
        auditEntry: AUDIT_ENTRY_ID,
        entityType: "REALM",
        entity: ENTITY_ID,
        delta: BASE_DELTA,
        ...overrides,
    });
}

describe("ChangeLog Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const log = createChangeLog();

            expect(log.changeType).toBe(ChangeSetType.UPDATE);
            expect(log.auditEntry).toBe(AUDIT_ENTRY_ID);
            expect(log.entityType).toBe("REALM");
            expect(log.entity).toBe(ENTITY_ID);
            expect(log.delta).toBe(BASE_DELTA);
        });

        it("should auto-generate id and createdAt", () => {
            const log = createChangeLog();

            expect(isUUID(log.id, "4")).toBe(true);
            expect(log.createdAt).toBeInstanceOf(Date);
        });

        it("should assign changeType CREATE", () => {
            const log = createChangeLog({ changeType: ChangeSetType.CREATE });

            expect(log.changeType).toBe(ChangeSetType.CREATE);
        });

        it("should assign changeType DELETE", () => {
            const log = createChangeLog({ changeType: ChangeSetType.DELETE });

            expect(log.changeType).toBe(ChangeSetType.DELETE);
        });
    });
});
