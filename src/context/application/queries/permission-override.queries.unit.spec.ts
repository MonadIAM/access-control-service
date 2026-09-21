import { describe, expect, it } from "@jest/globals";

import { PermissionOverrideQueriesUnitHelpers } from "~testing/unit/query-services/permission-override.helpers";
import { PublicLinkOperator } from "~infrastructure/database/enums";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new PermissionOverrideQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("PermissionOverrideQueries", () => {
    it("scopes a single entity lookup to the requested identity and realm", async () => {
        const { queries, repository } = helpers.queries();
        const entity = helpers.createPermissionOverride();
        repository.findUniqueOrThrow.mockResolvedValue(entity);

        await expect(
            queries.findUnique({
                override: ID,
                realm: REALM,
                view: ResponseViewType.DETAILED,
                mode: QueryMode.DEFAULT,
                actor: "caller",
            }),
        ).resolves.toBe(entity);

        expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: ID, realm: REALM, account: "caller" } }),
        );
    });

    it("keeps the list within its scope and preserves the repository page", async () => {
        const { queries, repository } = helpers.queries();
        const page: [Entities.PermissionOverride[], number] = [[helpers.createPermissionOverride()], 31];
        repository.findMany.mockResolvedValue(page);

        await expect(
            queries.findMany({
                realm: REALM,
                view: ResponseViewType.COMPACT,
                mode: QueryMode.DEFAULT,
                actor: "caller",
                pagination: PAGINATION,
                filters: {},
                sort: {},
            }),
        ).resolves.toBe(page);

        expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ prefilter: { realm: REALM }, pagination: PAGINATION }),
        );
    });

    it.each([
        { mode: QueryMode.DEFAULT, expectedAccount: "caller" },
        { mode: QueryMode.MANAGE, expectedAccount: "another-account" },
    ])("$mode determines whether the account filter can be supplied by the caller", async ({ mode, expectedAccount }) => {
        const { queries, repository } = helpers.queries();
        const filters: Repositories.Mappers.PermissionOverride.Filters = {
            account: { operator: PublicLinkOperator.EQUAL, value: "another-account" },
        };
        repository.findMany.mockResolvedValue([[], 0]);

        await queries.findMany({
            mode,
            actor: "caller",
            realm: REALM,
            pagination: PAGINATION,
            filters,
            sort: {},
            view: ResponseViewType.COMPACT,
        });

        expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                prefilter: { realm: REALM },
                filters: { account: { operator: PublicLinkOperator.EQUAL, value: expectedAccount } },
            }),
        );
        expect(filters.account?.value).toBe("another-account");
    });

    it("allows a manager to fetch another account's override within the selected realm", async () => {
        const { queries, repository } = helpers.queries();
        repository.findUniqueOrThrow.mockResolvedValue(helpers.createPermissionOverride());

        await queries.findUnique({ mode: QueryMode.MANAGE, override: ID, realm: REALM, view: ResponseViewType.COMPACT });

        expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: ID, realm: REALM } }),
        );
    });
});
