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

describe("[Entity] - ChangeLog", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange

            // Act
            const log = createChangeLog();

            // Assert
            expect(log.changeType).toBe(ChangeSetType.UPDATE);
            expect(log.auditEntry).toBe(AUDIT_ENTRY_ID);
            expect(log.entityType).toBe("REALM");
            expect(log.entity).toBe(ENTITY_ID);
            expect(log.delta).toBe(BASE_DELTA);
        });

        it("[case] - generates id and createdAt", () => {
            // Arrange

            // Act
            const log = createChangeLog();

            const result = isUUID(log.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(log.createdAt).toBeInstanceOf(Date);
        });

        it("[case] - assigns changeType CREATE", () => {
            // Arrange

            // Act
            const log = createChangeLog({ changeType: ChangeSetType.CREATE });

            // Assert
            expect(log.changeType).toBe(ChangeSetType.CREATE);
        });

        it("[case] - assigns changeType DELETE", () => {
            // Arrange

            // Act
            const log = createChangeLog({ changeType: ChangeSetType.DELETE });

            // Assert
            expect(log.changeType).toBe(ChangeSetType.DELETE);
        });
    });
});
