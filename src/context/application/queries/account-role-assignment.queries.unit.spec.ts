import { describe, expect, it } from "@jest/globals";

import { AccountRoleAssignmentQueriesUnitHelpers } from "~testing/unit/query-services/account-role-assignment.helpers";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new AccountRoleAssignmentQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("AccountRoleAssignmentQueries", () => {
    it("scopes a single entity lookup to the requested identity and realm", async () => {
        const { queries, repository } = helpers.queries();
        const entity = helpers.createAccountRoleAssignment();
        repository.findUniqueOrThrow.mockResolvedValue(entity);

        await expect(queries.findUnique({ assignment: ID, realm: REALM, view: ResponseViewType.DETAILED })).resolves.toBe(
            entity,
        );

        expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: ID, realm: REALM } }),
        );
    });

    it.each([
        { mode: QueryMode.DEFAULT, prefilter: { realm: REALM } },
        { mode: QueryMode.MANAGE, prefilter: {} },
    ])("$mode applies the appropriate realm boundary to lists", async ({ mode, prefilter }) => {
        const { queries, repository } = helpers.queries();
        const page: [Entities.AccountRoleAssignment[], number] = [[helpers.createAccountRoleAssignment()], 31];
        repository.findMany.mockResolvedValue(page);

        await expect(
            queries.findMany({
                mode,
                realm: REALM,
                pagination: PAGINATION,
                filters: {},
                sort: {},
                view: ResponseViewType.COMPACT,
            }),
        ).resolves.toBe(page);

        expect(repository.findMany).toHaveBeenCalledWith(expect.objectContaining({ prefilter, pagination: PAGINATION }));
    });
});
