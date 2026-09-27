import { describe, expect, it } from "@jest/globals";

import { RealmQueriesUnitHelpers } from "~testing/unit/query-services/realm.helpers";
import { PublicStringOperator } from "~infrastructure/database/enums";
import { QueryMode, ResponseViewType } from "~context/enums";

const ACCOUNT = "00000000-0000-4000-8000-000000000001";
const REALM = "00000000-0000-4000-8000-000000000002";
const FOREIGN_REALM = "00000000-0000-4000-8000-000000000003";

const PAGINATION: Pagination = { currentPage: 1, elementsPerPage: 10 };
const helpers = new RealmQueriesUnitHelpers();

describe("RealmQueries visibility", () => {
    describe("findMany", () => {
        it.each([
            { mode: QueryMode.DEFAULT, expectedIds: [REALM], scope: "accessible realms" },
            { mode: QueryMode.MANAGE, expectedIds: [FOREIGN_REALM], scope: "requested realms" },
        ])("$mode limits the selection to $scope", async ({ mode, expectedIds }) => {
            const { queries, repository, cache } = helpers.queries();
            const filters: Repositories.Mappers.Realm.Filters = {
                id: { operator: PublicStringOperator.IN, value: [FOREIGN_REALM] },
            };
            cache.collectRealms.mockResolvedValue([REALM]);
            repository.findMany.mockResolvedValue([[], 0]);

            await queries.findMany({
                mode,
                account: ACCOUNT,
                filters,
                pagination: PAGINATION,
                sort: {},
                view: ResponseViewType.COMPACT,
            });

            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    filters: { id: { operator: PublicStringOperator.IN, value: expectedIds } },
                }),
            );
            expect(filters.id?.value).toEqual([FOREIGN_REALM]);
        });

        it("propagates a visibility lookup failure without querying unrestricted data", async () => {
            const { queries, repository, cache } = helpers.queries();
            const error = new Error("projection unavailable");
            cache.collectRealms.mockRejectedValue(error);

            await expect(
                queries.findMany({
                    mode: QueryMode.DEFAULT,
                    account: ACCOUNT,
                    pagination: PAGINATION,
                    filters: {},
                    sort: {},
                    view: ResponseViewType.COMPACT,
                }),
            ).rejects.toBe(error);

            expect(repository.findMany).not.toHaveBeenCalled();
        });
    });

    describe("findMany / getLookupList", () => {
        it.each(["findMany", "getLookupList"] as const)(
            "%s returns an empty page without querying an unrestricted repository when no realms are accessible",
            async (method) => {
                const { queries, repository, cache } = helpers.queries();
                cache.collectRealms.mockResolvedValue([]);
                const request: Queries.Realm.FindMany.DefaultProps & Queries.Realm.GetLookupList.DefaultProps = {
                    mode: QueryMode.DEFAULT,
                    account: ACCOUNT,
                    pagination: PAGINATION,
                    view: ResponseViewType.COMPACT,
                    filters: {},
                    sort: {},
                    term: "",
                };

                await expect(queries[method](request)).resolves.toEqual([[], 0]);

                expect(cache.collectRealms).toHaveBeenCalledWith({ account: ACCOUNT });
                expect(repository[method]).not.toHaveBeenCalled();
            },
        );
    });

    describe("findUnique", () => {
        it("does not fetch a realm when the account has no relation to it", async () => {
            const { queries, repository, cache } = helpers.queries();
            cache.checkRealm.mockResolvedValue(false);

            await expect(
                queries.findUnique({
                    mode: QueryMode.DEFAULT,
                    view: ResponseViewType.COMPACT,
                    account: ACCOUNT,
                    realm: REALM,
                }),
            ).rejects.toThrow("queries.realm.RELATION_NOT_FOUND");

            expect(cache.checkRealm).toHaveBeenCalledWith({ account: ACCOUNT, realm: REALM });
            expect(repository.findUniqueOrThrow).not.toHaveBeenCalled();
        });

        it("returns the requested realm when the account has a relation to it", async () => {
            const { queries, repository, cache } = helpers.queries();
            const realm = helpers.createRealm({ id: REALM });
            cache.checkRealm.mockResolvedValue(true);
            repository.findUniqueOrThrow.mockResolvedValue(realm);

            await expect(
                queries.findUnique({
                    mode: QueryMode.DEFAULT,
                    view: ResponseViewType.COMPACT,
                    account: ACCOUNT,
                    realm: REALM,
                }),
            ).resolves.toBe(realm);

            expect(cache.checkRealm).toHaveBeenCalledWith({ account: ACCOUNT, realm: REALM });
            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(expect.objectContaining({ where: { id: REALM } }));
        });

        it("allows management access without requiring personal realm membership", async () => {
            const { queries, repository, cache } = helpers.queries();
            const realm = helpers.createRealm({ id: REALM });
            repository.findUniqueOrThrow.mockResolvedValue(realm);

            await expect(
                queries.findUnique({ mode: QueryMode.MANAGE, realm: REALM, view: ResponseViewType.COMPACT }),
            ).resolves.toBe(realm);

            expect(cache.checkRealm).not.toHaveBeenCalled();
        });
    });

    describe("getLookupList", () => {
        it.each([
            { mode: QueryMode.DEFAULT, expectedRealms: [REALM] },
            { mode: QueryMode.MANAGE, expectedRealms: undefined },
        ])("$mode applies realm visibility to a nonempty lookup", async ({ mode, expectedRealms }) => {
            const { queries, repository, cache } = helpers.queries();
            cache.collectRealms.mockResolvedValue([REALM]);
            const page: [Entities.Realm[], number] = [[helpers.createRealm({ id: REALM })], 1];
            repository.getLookupList.mockResolvedValue(page);

            await expect(
                queries.getLookupList({ mode, account: ACCOUNT, pagination: PAGINATION, term: "project" }),
            ).resolves.toBe(page);

            expect(repository.getLookupList).toHaveBeenCalledWith({
                realms: expectedRealms,
                pagination: PAGINATION,
                term: "project",
            });
        });
    });
});
