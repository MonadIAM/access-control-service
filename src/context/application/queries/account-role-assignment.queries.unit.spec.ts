import { describe, expect, it } from "@jest/globals";

import { AccountRoleAssignmentQueriesUnitHelpers } from "~testing/unit/query-services/account-role-assignment.helpers";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new AccountRoleAssignmentQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - AccountRoleAssignment", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createAccountRoleAssignment();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({ assignment: ID, realm: REALM, view: ResponseViewType.DETAILED });

            // Assert
            expect(result).toBe(entity);
            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, realm: REALM } }),
            );
        });
    });

    describe("[Method] - findMany", () => {
        it.each([
            { mode: QueryMode.DEFAULT, prefilter: { realm: REALM } },
            { mode: QueryMode.MANAGE, prefilter: {} },
        ])("[case] - scopes lists by realm ($mode)", async ({ mode, prefilter }) => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const page: [Entities.AccountRoleAssignment[], number] = [[helpers.createAccountRoleAssignment()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                mode,
                realm: REALM,
                pagination: PAGINATION,
                filters: {},
                sort: {},
                view: ResponseViewType.COMPACT,
            });

            // Assert
            expect(result).toBe(page);
            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter, pagination: PAGINATION }),
            );
        });
    });
});
