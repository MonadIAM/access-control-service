import { describe, expect, it } from "@jest/globals";

import { AuditLogIntegrationHelpers } from "~testing/integration/domain-service/audit-log.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { AuditLog } from "~common/transaction-manager";

const helpers = new AuditLogIntegrationHelpers();

async function setCreatedAt(
    suite: Integration.Domain.AuditLog.Suite,
    log: SystemEntities.AuditLog,
    createdAt: Date,
): Promise<void> {
    await suite.transaction(async (transaction) => {
        const persisted = await transaction.findOneOrFail(AuditLog, { id: log.id });
        persisted.createdAt = createdAt;
    });
}

async function loadAuditLogs(suite: Integration.Domain.AuditLog.Suite): Promise<SystemEntities.AuditLog[]> {
    return await suite.transaction((transaction) => transaction.find(AuditLog, {}, { orderBy: { createdAt: "asc" } }));
}

describe("AuditLogService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("purges only an expired batch and keeps fresh audit logs", async () => {
        const fresh = await suite.fixtures().createAuditLog();
        const first = await suite.fixtures().createAuditLog();
        const second = await suite.fixtures().createAuditLog();
        const third = await suite.fixtures().createAuditLog();

        await setCreatedAt(suite, fresh, new Date("2999-01-01T00:00:00.000Z"));
        await setCreatedAt(suite, first, new Date("2026-01-01T00:00:00.000Z"));
        await setCreatedAt(suite, second, new Date("2026-01-02T00:00:00.000Z"));
        await setCreatedAt(suite, third, new Date("2026-01-03T00:00:00.000Z"));

        const purged = await suite.transaction((transaction) =>
            suite.repository().auditLogService.purgeExpired({
                expirationDate: new Date("2026-02-01T00:00:00.000Z"),
                batchSize: 2,
                transaction,
            }),
        );

        const remaining = await loadAuditLogs(suite);

        expect(purged).toHaveLength(2);
        expect(purged.every(({ createdAt }) => createdAt < new Date("2026-02-01T00:00:00.000Z"))).toBe(true);
        expect(remaining).toHaveLength(2);
        expect(remaining.map(({ id }) => id)).toContain(fresh.id);
        expect(remaining.filter(({ createdAt }) => createdAt < new Date("2026-02-01T00:00:00.000Z"))).toHaveLength(1);
    });
});
