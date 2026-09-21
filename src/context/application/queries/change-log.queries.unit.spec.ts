import { describe, expect, it } from "@jest/globals";

import { ChangeLogQueriesUnitHelpers } from "~testing/unit/query-services/change-log.helpers";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new ChangeLogQueriesUnitHelpers();
const ID = "requested-entity";

describe("ChangeLogQueries", () => {
    it("scopes a single entity lookup to the requested identity", async () => {
        const { queries, repository } = helpers.queries();
        const entity = helpers.createChangeLog();
        repository.findUniqueOrThrow.mockResolvedValue(entity);

        await expect(queries.findUnique({ log: ID })).resolves.toBe(entity);

        expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(expect.objectContaining({ where: { id: ID } }));
    });

    it("keeps the list within its scope and preserves the repository page", async () => {
        const { queries, repository } = helpers.queries();
        const page: [SystemEntities.ChangeLog[], number] = [[helpers.createChangeLog()], 31];
        repository.findMany.mockResolvedValue(page);

        await expect(queries.findMany({ pagination: PAGINATION, filters: {}, sort: {} })).resolves.toBe(page);

        expect(repository.findMany).toHaveBeenCalledWith(expect.objectContaining({ pagination: PAGINATION }));
    });
});
