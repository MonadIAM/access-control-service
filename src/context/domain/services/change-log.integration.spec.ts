import { describe, expect, it } from "@jest/globals";

import { ChangeLogIntegrationHelpers } from "~testing/integration/domain-service/change-log.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { ChangeLog } from "~common/transaction-manager";

const helpers = new ChangeLogIntegrationHelpers();

async function setCreatedAt(
    suite: Integration.Domain.ChangeLog.Suite,
    log: SystemEntities.ChangeLog,
    createdAt: Date,
): Promise<void> {
    await suite.transaction(async (transaction) => {
        const persisted = await transaction.findOneOrFail(ChangeLog, { id: log.id });
        persisted.createdAt = createdAt;
    });
}

async function loadChangeLogs(suite: Integration.Domain.ChangeLog.Suite): Promise<SystemEntities.ChangeLog[]> {
    return await suite.transaction((transaction) => transaction.find(ChangeLog, {}, { orderBy: { createdAt: "asc" } }));
}

describe("[DomainService] - ChangeLog", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - purgeExpired", () => {
        it("[case] - purges only an expired batch and keeps fresh change logs", async () => {
            // Arrange
            const fresh = await suite.fixtures().createChangeLog();
            const first = await suite.fixtures().createChangeLog();
            const second = await suite.fixtures().createChangeLog();
            const third = await suite.fixtures().createChangeLog();
            await setCreatedAt(suite, fresh, new Date("2999-01-01T00:00:00.000Z"));
            await setCreatedAt(suite, first, new Date("2026-01-01T00:00:00.000Z"));
            await setCreatedAt(suite, second, new Date("2026-01-02T00:00:00.000Z"));
            await setCreatedAt(suite, third, new Date("2026-01-03T00:00:00.000Z"));

            // Act
            const purged = await suite.transaction((transaction) =>
                suite.repository().changeLogService.purgeExpired({
                    expirationDate: new Date("2026-02-01T00:00:00.000Z"),
                    batchSize: 2,
                    transaction,
                }),
            );

            const remaining = await loadChangeLogs(suite);

            // Assert
            expect(purged).toHaveLength(2);
            expect(purged.every(({ createdAt }) => createdAt < new Date("2026-02-01T00:00:00.000Z"))).toBe(true);
            expect(remaining).toHaveLength(2);
            expect(remaining.map(({ id }) => id)).toContain(fresh.id);
            expect(remaining.filter(({ createdAt }) => createdAt < new Date("2026-02-01T00:00:00.000Z"))).toHaveLength(1);
        });
    });
});
