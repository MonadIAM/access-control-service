import { describe, expect, it } from "@jest/globals";

import { AuditLogQueriesUnitHelpers } from "~testing/unit/query-services/audit-log.helpers";
import { QueryMode } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new AuditLogQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - AuditLog", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createAuditLog();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({ log: ID, realm: REALM, mode: QueryMode.DEFAULT });

            // Assert
            expect(result).toBe(entity);
            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, realm: REALM } }),
            );
        });
    });

    describe("[Method] - findMany", () => {
        it("[case] - keeps the list within its scope and preserves the repository page", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const page: [SystemEntities.AuditLog[], number] = [[helpers.createAuditLog()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                mode: QueryMode.DEFAULT,
                realm: REALM,
                pagination: PAGINATION,
                filters: {},
                sort: {},
            });

            // Assert
            expect(result).toBe(page);
            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter: { realm: REALM }, pagination: PAGINATION }),
            );
        });
    });

    describe("[Behavior] - query scope", () => {
        it("[case] - allows management queries across realms for both single logs and lists", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            repository.findMany.mockResolvedValue([[], 0]);
            repository.findUniqueOrThrow.mockResolvedValue(helpers.createAuditLog());

            // Act
            await queries.findUnique({ mode: QueryMode.MANAGE, log: ID });
            await queries.findMany({ mode: QueryMode.MANAGE, pagination: PAGINATION, filters: {}, sort: {} });

            // Assert
            expect(repository.findUniqueOrThrow.mock.calls).toEqual([[{ where: { id: ID } }]]);
            expect(repository.findMany).toHaveBeenCalledWith(expect.objectContaining({ prefilter: {} }));
        });
    });
});
