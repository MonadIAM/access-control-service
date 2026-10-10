import { describe, expect, it } from "@jest/globals";

import { PermissionQueriesUnitHelpers } from "~testing/unit/query-services/permission.helpers";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new PermissionQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - Permission", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createPermission();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({ permission: ID, realm: REALM, view: ResponseViewType.DETAILED });

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
            const page: [Entities.Permission[], number] = [[helpers.createPermission()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                mode,
                realm: REALM,
                pagination: PAGINATION,
                filters: {},
                sort: {},
                view: ResponseViewType.COMPACT,
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
                mode,
                actor: "caller",
                account: "target",
                realm: REALM,
                pagination: PAGINATION,
                filters: {},
                sort: {},
            });

            // Assert
            expect(repository.findEffective).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { account: expectedAccount, realm: REALM },
                }),
            );
        });
    });
});
