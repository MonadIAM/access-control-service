import { describe, expect, it } from "@jest/globals";

import { RolePermissionAssignmentQueriesUnitHelpers } from "~testing/unit/query-services/role-permission-assignment.helpers";
import { ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RolePermissionAssignmentQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("RolePermissionAssignmentQueries", () => {
    it("scopes a single entity lookup to the requested identity and realm", async () => {
        const { queries, repository } = helpers.queries();
        const entity = helpers.createRolePermissionAssignment();
        repository.findUniqueOrThrow.mockResolvedValue(entity);

        await expect(queries.findUnique({ assignment: ID, realm: REALM, view: ResponseViewType.DETAILED })).resolves.toBe(
            entity,
        );

        expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: ID, realm: REALM } }),
        );
    });

    it("keeps the list within its scope and preserves the repository page", async () => {
        const { queries, repository } = helpers.queries();
        const page: [Entities.RolePermissionAssignment[], number] = [[helpers.createRolePermissionAssignment()], 31];
        repository.findMany.mockResolvedValue(page);

        await expect(
            queries.findMany({
                view: ResponseViewType.COMPACT,
                pagination: PAGINATION,
                realm: REALM,
                filters: {},
                sort: {},
            }),
        ).resolves.toBe(page);

        expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ prefilter: { realm: REALM }, pagination: PAGINATION }),
        );
    });
});
