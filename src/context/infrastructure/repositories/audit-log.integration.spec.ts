import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { postgresSuite } from "~testing/integration/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { ActionType, EntityType } from "~context/enums";

import { AuditLogRepository } from "./audit-log.repository";

describe("AuditLogRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new AuditLogRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("maps the persisted audit log entry through the schema", async () => {
        const realm = randomUUID();
        const actor = randomUUID();
        const auditLog = await suite.fixtures().createAuditLog({
            context: { ip: "10.20.30.40", userAgent: "mapping-agent" },
            input: { field: "mapping-input" },
            actionType: ActionType.UPDATE,
            entityType: EntityType.ROLE,
            actor,
            realm,
        });

        await expect(suite.repository().findUniqueOrThrow({ where: { id: auditLog.id } })).resolves.toMatchObject({
            input: { field: "mapping-input" },
            keyVersion: auditLog.keyVersion,
            signature: auditLog.signature,
            createdAt: auditLog.createdAt,
            actionType: ActionType.UPDATE,
            entityType: EntityType.ROLE,
            userAgent: "mapping-agent",
            ip: "10.20.30.40",
            id: auditLog.id,
            actor,
            realm,
        });
    });
});
