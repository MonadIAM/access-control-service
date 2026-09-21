import { describe, expect, it } from "@jest/globals";

import { RoleDelegationPolicyQueriesUnitHelpers } from "~testing/unit/query-services/role-delegation-policy.helpers";
import { ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RoleDelegationPolicyQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("RoleDelegationPolicyQueries", () => {
    it("scopes a single entity lookup to the requested identity and realm", async () => {
        const { queries, repository } = helpers.queries();
        const entity = helpers.createRoleDelegationPolicy();
        repository.findUniqueOrThrow.mockResolvedValue(entity);

        await expect(queries.findUnique({ policy: ID, realm: REALM, view: ResponseViewType.DETAILED })).resolves.toBe(
            entity,
        );

        expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: ID, realm: REALM } }),
        );
    });

    it("keeps the list within its scope and preserves the repository page", async () => {
        const { queries, repository } = helpers.queries();
        const page: [Entities.RoleDelegationPolicy[], number] = [[helpers.createRoleDelegationPolicy()], 31];
        repository.findMany.mockResolvedValue(page);

        await expect(
            queries.findMany({
                realm: REALM,
                view: ResponseViewType.COMPACT,
                pagination: PAGINATION,
                filters: {},
                sort: {},
            }),
        ).resolves.toBe(page);

        expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ prefilter: { realm: REALM }, pagination: PAGINATION }),
        );
    });
});
