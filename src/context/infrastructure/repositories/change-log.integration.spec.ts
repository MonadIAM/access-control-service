import { describe, expect, it } from "@jest/globals";
import { ChangeSetType } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { DeltaChanges } from "~common/transaction-manager/value-objects";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { EntityType } from "~context/enums";

import { ChangeLogRepository } from "./change-log.repository";

describe("ChangeLogRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new ChangeLogRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("maps the persisted change log entry through the schema", async () => {
        const entity = randomUUID();
        const changeLog = await suite.fixtures().createChangeLog({
            delta: new DeltaChanges({ name: { old: "Old Name", new: "New Name" } }),
            changeType: ChangeSetType.UPDATE,
            entityType: EntityType.ROLE,
            entity,
        });

        await expect(suite.repository().findUniqueOrThrow({ where: { id: changeLog.id } })).resolves.toMatchObject({
            delta: new DeltaChanges({ name: { old: "Old Name", new: "New Name" } }),
            auditEntry: changeLog.auditEntry,
            changeType: ChangeSetType.UPDATE,
            keyVersion: changeLog.keyVersion,
            signature: changeLog.signature,
            createdAt: changeLog.createdAt,
            entityType: EntityType.ROLE,
            id: changeLog.id,
            entity,
        });
    });
});
