import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { AuditLogUnitHelpers } from "~testing/unit/domain-service/audit-log.helpers";

const EXPIRATION_DATE = new Date("2026-01-01T00:00:00.000Z");
const BATCH_SIZE = 50;

const helpers = new AuditLogUnitHelpers();

describe("AuditLogService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("purgeExpired", () => {
        it("finds expired entries by batch size, removes them, and returns them", async () => {
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createAuditLog();
            const second = helpers.createAuditLog();
            repositories.auditLogs.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.purgeExpired({
                transaction: transaction.entityManager,
                expirationDate: EXPIRATION_DATE,
                batchSize: BATCH_SIZE,
            });

            expect(repositories.auditLogs.find).toHaveBeenCalledWith({
                where: { createdAt: { $lt: EXPIRATION_DATE } },
                transaction: transaction.entityManager,
                options: { limit: BATCH_SIZE },
            });
            expect(transaction.remove).toHaveBeenNthCalledWith(1, first);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, second);
            expect(result).toEqual([first, second]);
        });
    });
});
