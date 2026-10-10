import { describe, expect, it } from "@jest/globals";

import { RoleQueriesUnitHelpers } from "~testing/unit/query-services/role.helpers";
import { DelegatorType, QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RoleQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - Role", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createRole();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({ role: ID, realm: REALM, view: ResponseViewType.DETAILED });

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
            { mode: QueryMode.MANAGE, prefilter: undefined },
        ])("[case] - scopes lists by realm ($mode)", async ({ mode, prefilter }) => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const page: [Entities.Role[], number] = [[helpers.createRole()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                view: ResponseViewType.COMPACT,
                pagination: PAGINATION,
                realm: REALM,
                filters: {},
                sort: {},
                mode,
            });

            // Assert
            expect(result).toBe(page);
            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter, pagination: PAGINATION }),
            );
        });
    });

    describe("[Method] - getLookupList", () => {
        it.each([
            { mode: QueryMode.DEFAULT, expectedRealm: REALM },
            { mode: QueryMode.MANAGE, expectedRealm: undefined },
        ])("[case] - scopes lookups by realm ($mode)", async ({ mode, expectedRealm }) => {
            // Arrange
            const { queries, repository } = helpers.queries();
            repository.getLookupList.mockResolvedValue([[], 0]);

            // Act
            await queries.getLookupList({ mode, realm: REALM, pagination: PAGINATION, term: "read" });

            // Assert
            expect(repository.getLookupList).toHaveBeenCalledWith({
                realm: expectedRealm,
                pagination: PAGINATION,
                term: "read",
            });
        });
    });

    describe("[Method] - findEffective", () => {
        it.each([
            { mode: QueryMode.DEFAULT, expectedAccount: "caller" },
            { mode: QueryMode.MANAGE, expectedAccount: "target" },
        ])("[case] - selects the effective account ($mode)", async ({ mode, expectedAccount }) => {
            // Arrange
            const { queries, repository } = helpers.queries();
            repository.findEffective.mockResolvedValue([[], 0]);

            // Act
            await queries.findEffective({
                pagination: PAGINATION,
                account: "target",
                actor: "caller",
                realm: REALM,
                filters: {},
                sort: {},
                mode,
            });

            // Assert
            expect(repository.findEffective).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { account: expectedAccount, realm: mode === QueryMode.DEFAULT ? REALM : undefined },
                }),
            );
        });
    });

    describe("[Method] - findDelegableByAccount", () => {
        it.each([
            { mode: QueryMode.DEFAULT, expectedId: "caller", expectedRealm: REALM },
            { mode: QueryMode.MANAGE, expectedId: "target", expectedRealm: undefined },
        ])("[case] - uses the correct delegating account ($mode)", async ({ mode, expectedId, expectedRealm }) => {
            // Arrange
            const { queries, repository } = helpers.queries();
            repository.findDelegable.mockResolvedValue([[], 0]);

            // Act
            await queries.findDelegableByAccount({
                pagination: PAGINATION,
                account: "target",
                actor: "caller",
                realm: REALM,
                filters: {},
                sort: {},
                mode,
            });

            // Assert
            expect(repository.findDelegable).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { type: DelegatorType.ACCOUNT, id: expectedId, realm: expectedRealm },
                }),
            );
        });
    });

    describe("[Method] - findDelegableByRole", () => {
        it("[case] - uses a role delegator and retains its realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            repository.findDelegable.mockResolvedValue([[], 0]);

            // Act
            await queries.findDelegableByRole({ id: ID, realm: REALM, pagination: PAGINATION, filters: {}, sort: {} });

            // Assert
            expect(repository.findDelegable).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { type: DelegatorType.ROLE, id: ID, realm: REALM },
                }),
            );
        });
    });

    describe("[Behavior] - hierarchy traversal", () => {
        it.each(["findAncestors", "findDescendants"] as const)(
            "[case] - retains traversal direction, realm and returned depth (%s)",
            async (method) => {
                // Arrange
                const { queries, repository } = helpers.queries();
                const page: [Queries.Role.DepthEntity[], number] = [[Object.assign(helpers.createRole(), { depth: 2 })], 1];
                repository[method].mockResolvedValue(page);

                // Act
                const result = await queries[method]({
                    view: ResponseViewType.DETAILED,
                    descendant: "descendant",
                    pagination: PAGINATION,
                    ancestor: "ancestor",
                    realm: REALM,
                    filters: {},
                });
                const direction = method === "findAncestors" ? { descendant: "descendant" } : { ancestor: "ancestor" };

                // Assert
                expect(result).toBe(page);
                expect(repository[method].mock.calls).toEqual([
                    [{ ...direction, realm: REALM, pagination: PAGINATION, filters: {}, populate: ["realm"] }],
                ]);
            },
        );
    });

    describe("[Method] - getHierarchyGraph", () => {
        it("[case] - loads a hierarchy graph only for the requested realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const graph: Queries.Role.Graph = { nodes: [], edges: [] };
            repository.getHierarchyGraph.mockResolvedValue(graph);

            // Act
            const result = await queries.getHierarchyGraph({ realm: REALM });

            // Assert
            expect(result).toBe(graph);
            expect(repository.getHierarchyGraph).toHaveBeenCalledWith({ realm: REALM });
        });
    });
});
