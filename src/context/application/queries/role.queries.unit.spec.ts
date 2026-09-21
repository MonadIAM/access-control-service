import { describe, expect, it } from "@jest/globals";

import { RoleQueriesUnitHelpers } from "~testing/unit/query-services/role.helpers";
import { DelegatorType, QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RoleQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("RoleQueries", () => {
    it("scopes a single entity lookup to the requested identity and realm", async () => {
        const { queries, repository } = helpers.queries();
        const entity = helpers.createRole();
        repository.findUniqueOrThrow.mockResolvedValue(entity);

        await expect(queries.findUnique({ role: ID, realm: REALM, view: ResponseViewType.DETAILED })).resolves.toBe(entity);

        expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: ID, realm: REALM } }),
        );
    });

    it.each([
        { mode: QueryMode.DEFAULT, prefilter: { realm: REALM } },
        { mode: QueryMode.MANAGE, prefilter: undefined },
    ])("$mode applies the appropriate realm boundary to lists", async ({ mode, prefilter }) => {
        const { queries, repository } = helpers.queries();
        const page: [Entities.Role[], number] = [[helpers.createRole()], 31];
        repository.findMany.mockResolvedValue(page);

        await expect(
            queries.findMany({
                view: ResponseViewType.COMPACT,
                pagination: PAGINATION,
                realm: REALM,
                filters: {},
                sort: {},
                mode,
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
            pagination: PAGINATION,
            account: "target",
            actor: "caller",
            realm: REALM,
            filters: {},
            sort: {},
            mode,
        });

        expect(repository.findEffective).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { account: expectedAccount, realm: mode === QueryMode.DEFAULT ? REALM : undefined },
            }),
        );
    });

    it.each([
        { mode: QueryMode.DEFAULT, expectedId: "caller", expectedRealm: REALM },
        { mode: QueryMode.MANAGE, expectedId: "target", expectedRealm: undefined },
    ])("$mode uses the correct delegating account", async ({ mode, expectedId, expectedRealm }) => {
        const { queries, repository } = helpers.queries();
        repository.findDelegable.mockResolvedValue([[], 0]);

        await queries.findDelegableByAccount({
            pagination: PAGINATION,
            account: "target",
            actor: "caller",
            realm: REALM,
            filters: {},
            sort: {},
            mode,
        });

        expect(repository.findDelegable).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { type: DelegatorType.ACCOUNT, id: expectedId, realm: expectedRealm },
            }),
        );
    });

    it("uses a role delegator and retains its realm", async () => {
        const { queries, repository } = helpers.queries();
        repository.findDelegable.mockResolvedValue([[], 0]);

        await queries.findDelegableByRole({ id: ID, realm: REALM, pagination: PAGINATION, filters: {}, sort: {} });

        expect(repository.findDelegable).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { type: DelegatorType.ROLE, id: ID, realm: REALM },
            }),
        );
    });

    it.each(["findAncestors", "findDescendants"] as const)(
        "%s retains traversal direction, realm and returned depth",
        async (method) => {
            const { queries, repository } = helpers.queries();
            const page: [Queries.Role.DepthEntity[], number] = [[Object.assign(helpers.createRole(), { depth: 2 })], 1];
            repository[method].mockResolvedValue(page);

            await expect(
                queries[method]({
                    view: ResponseViewType.DETAILED,
                    descendant: "descendant",
                    pagination: PAGINATION,
                    ancestor: "ancestor",
                    realm: REALM,
                    filters: {},
                }),
            ).resolves.toBe(page);

            const direction = method === "findAncestors" ? { descendant: "descendant" } : { ancestor: "ancestor" };
            expect(repository[method].mock.calls).toEqual([
                [{ ...direction, realm: REALM, pagination: PAGINATION, filters: {}, populate: ["realm"] }],
            ]);
        },
    );

    it("loads a hierarchy graph only for the requested realm", async () => {
        const { queries, repository } = helpers.queries();
        const graph: Queries.Role.Graph = { nodes: [], edges: [] };
        repository.getHierarchyGraph.mockResolvedValue(graph);

        await expect(queries.getHierarchyGraph({ realm: REALM })).resolves.toBe(graph);

        expect(repository.getHierarchyGraph).toHaveBeenCalledWith({ realm: REALM });
    });
});
