import { describe, expect, it } from "@jest/globals";

import { ChangeLogQueriesUnitHelpers } from "~testing/unit/query-services/change-log.helpers";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new ChangeLogQueriesUnitHelpers();
const ID = "requested-entity";

describe("[Queries] - ChangeLog", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createChangeLog();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({ log: ID });

            // Assert
            expect(result).toBe(entity);
            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(expect.objectContaining({ where: { id: ID } }));
        });
    });

    describe("[Method] - findMany", () => {
        it("[case] - keeps the list within its scope and preserves the repository page", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const page: [SystemEntities.ChangeLog[], number] = [[helpers.createChangeLog()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({ pagination: PAGINATION, filters: {}, sort: {} });

            // Assert
            expect(result).toBe(page);
            expect(repository.findMany).toHaveBeenCalledWith(expect.objectContaining({ pagination: PAGINATION }));
        });
    });
});
