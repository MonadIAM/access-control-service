import { describe, expect, it } from "@jest/globals";

import { PermissionQueriesUnitHelpers } from "~testing/unit/query-services/permission.helpers";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new PermissionQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("PermissionQueries", () => {
    it("scopes a single entity lookup to the requested identity and realm", async () => {
        const { queries, repository } = helpers.queries();
        const entity = helpers.createPermission();
        repository.findUniqueOrThrow.mockResolvedValue(entity);

        await expect(queries.findUnique({ permission: ID, realm: REALM, view: ResponseViewType.DETAILED })).resolves.toBe(
            entity,
        );

        expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: ID, realm: REALM } }),
        );
    });

    it.each([
        { mode: QueryMode.DEFAULT, prefilter: { realm: REALM } },
        { mode: QueryMode.MANAGE, prefilter: undefined },
    ])("$mode applies the appropriate realm boundary to lists", async ({ mode, prefilter }) => {
        const { queries, repository } = helpers.queries();
        const page: [Entities.Permission[], number] = [[helpers.createPermission()], 31];
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

    it.each([
        { mode: QueryMode.DEFAULT, expectedRealm: REALM },
        { mode: QueryMode.MANAGE, expectedRealm: undefined },
    ])("$mode applies the realm boundary to lookup searches", async ({ mode, expectedRealm }) => {
        const { queries, repository } = helpers.queries();
        repository.getLookupList.mockResolvedValue([[], 0]);

        await queries.getLookupList({ mode, realm: REALM, pagination: PAGINATION, term: "read" });

        expect(repository.getLookupList).toHaveBeenCalledWith({
            realm: expectedRealm,
            pagination: PAGINATION,
            term: "read",
        });
    });

    it.each([
        { mode: QueryMode.DEFAULT, expectedAccount: "caller" },
        { mode: QueryMode.MANAGE, expectedAccount: "target" },
    ])("$mode selects the correct account for effective access", async ({ mode, expectedAccount }) => {
        const { queries, repository } = helpers.queries();
        repository.findEffective.mockResolvedValue([[], 0]);

        await queries.findEffective({
            mode,
            actor: "caller",
            account: "target",
            realm: REALM,
            pagination: PAGINATION,
            filters: {},
            sort: {},
        });

        expect(repository.findEffective).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { account: expectedAccount, realm: REALM },
            }),
        );
    });
});
