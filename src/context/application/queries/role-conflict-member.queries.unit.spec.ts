import { describe, expect, it } from "@jest/globals";

import { RoleConflictMemberQueriesUnitHelpers } from "~testing/unit/query-services/role-conflict-member.helpers";
import { ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RoleConflictMemberQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("RoleConflictMemberQueries", () => {
    describe("findUnique", () => {
        it("scopes a single entity lookup to the requested identity and realm", async () => {
            const { queries, repository } = helpers.queries();
            const entity = helpers.createRoleConflictMember();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            await expect(
                queries.findUnique({ member: ID, realm: REALM, view: ResponseViewType.DETAILED, group: "group-a" }),
            ).resolves.toBe(entity);

            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, group: { id: "group-a", realm: REALM } } }),
            );
        });
    });

    describe("findMany", () => {
        it("keeps the list within its scope and preserves the repository page", async () => {
            const { queries, repository } = helpers.queries();
            const page: [Entities.RoleConflictMember[], number] = [[helpers.createRoleConflictMember()], 31];
            repository.findMany.mockResolvedValue(page);

            await expect(
                queries.findMany({
                    view: ResponseViewType.COMPACT,
                    pagination: PAGINATION,
                    group: "group-a",
                    realm: REALM,
                    filters: {},
                    sort: {},
                }),
            ).resolves.toBe(page);

            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter: { group: { id: "group-a", realm: REALM } }, pagination: PAGINATION }),
            );
        });
    });
});
