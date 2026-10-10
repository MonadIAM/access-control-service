import { describe, expect, it } from "@jest/globals";

import { RoleDelegationPolicyQueriesUnitHelpers } from "~testing/unit/query-services/role-delegation-policy.helpers";
import { ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RoleDelegationPolicyQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - RoleDelegationPolicy", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createRoleDelegationPolicy();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({ policy: ID, realm: REALM, view: ResponseViewType.DETAILED });

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
            const page: [Entities.RoleDelegationPolicy[], number] = [[helpers.createRoleDelegationPolicy()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                realm: REALM,
                view: ResponseViewType.COMPACT,
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
});
