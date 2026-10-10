import { describe, expect, it } from "@jest/globals";

import { RolePermissionAssignmentQueriesUnitHelpers } from "~testing/unit/query-services/role-permission-assignment.helpers";
import { ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RolePermissionAssignmentQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - RolePermissionAssignment", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createRolePermissionAssignment();
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
        it("[case] - keeps the list within its scope and preserves the repository page", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const page: [Entities.RolePermissionAssignment[], number] = [[helpers.createRolePermissionAssignment()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                view: ResponseViewType.COMPACT,
                pagination: PAGINATION,
                realm: REALM,
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
