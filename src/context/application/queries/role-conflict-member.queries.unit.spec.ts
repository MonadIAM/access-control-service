import { describe, expect, it } from "@jest/globals";

import { RoleConflictMemberQueriesUnitHelpers } from "~testing/unit/query-services/role-conflict-member.helpers";
import { ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RoleConflictMemberQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - RoleConflictMember", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createRoleConflictMember();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({
                member: ID,
                realm: REALM,
                view: ResponseViewType.DETAILED,
                group: "group-a",
            });

            // Assert
            expect(result).toBe(entity);
            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, group: { id: "group-a", realm: REALM } } }),
            );
        });
    });

    describe("[Method] - findMany", () => {
        it("[case] - keeps the list within its scope and preserves the repository page", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const page: [Entities.RoleConflictMember[], number] = [[helpers.createRoleConflictMember()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                view: ResponseViewType.COMPACT,
                pagination: PAGINATION,
                group: "group-a",
                realm: REALM,
                filters: {},
                sort: {},
            });

            // Assert
            expect(result).toBe(page);
            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter: { group: { id: "group-a", realm: REALM } }, pagination: PAGINATION }),
            );
        });
    });
});
