import { describe, expect, it } from "@jest/globals";

import { PermissionOverrideQueriesUnitHelpers } from "~testing/unit/query-services/permission-override.helpers";
import { PublicLinkOperator } from "~infrastructure/database/enums";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new PermissionOverrideQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - PermissionOverride", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createPermissionOverride();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({
                override: ID,
                realm: REALM,
                view: ResponseViewType.DETAILED,
                mode: QueryMode.DEFAULT,
                actor: "caller",
            });

            // Assert
            expect(result).toBe(entity);
            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, realm: REALM, account: "caller" } }),
            );
        });

        it("[case] - allows a manager to fetch another account's override within the selected realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            repository.findUniqueOrThrow.mockResolvedValue(helpers.createPermissionOverride());

            // Act
            await queries.findUnique({
                mode: QueryMode.MANAGE,
                override: ID,
                realm: REALM,
                view: ResponseViewType.COMPACT,
            });

            // Assert
            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, realm: REALM } }),
            );
        });
    });

    describe("[Method] - findMany", () => {
        it("[case] - keeps the list within its scope and preserves the repository page", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const page: [Entities.PermissionOverride[], number] = [[helpers.createPermissionOverride()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                realm: REALM,
                view: ResponseViewType.COMPACT,
                mode: QueryMode.DEFAULT,
                actor: "caller",
                pagination: PAGINATION,
                filters: {},
                sort: {},
            });

            // Assert
            expect(result).toBe(page);
            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter: { realm: REALM }, pagination: PAGINATION }),
            );
        });

        it.each([
            { mode: QueryMode.DEFAULT, expectedAccount: "caller" },
            { mode: QueryMode.MANAGE, expectedAccount: "another-account" },
        ])(
            "[case] - determines whether the account filter can be supplied by the caller ($mode)",
            async ({ mode, expectedAccount }) => {
                // Arrange
                const { queries, repository } = helpers.queries();
                const filters: Repositories.Mappers.PermissionOverride.Filters = {
                    account: { operator: PublicLinkOperator.EQUAL, value: "another-account" },
                };
                repository.findMany.mockResolvedValue([[], 0]);

                // Act
                await queries.findMany({
                    mode,
                    actor: "caller",
                    realm: REALM,
                    pagination: PAGINATION,
                    filters,
                    sort: {},
                    view: ResponseViewType.COMPACT,
                });

                // Assert
                expect(repository.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        prefilter: { realm: REALM },
                        filters: { account: { operator: PublicLinkOperator.EQUAL, value: expectedAccount } },
                    }),
                );
                expect(filters.account?.value).toBe("another-account");
            },
        );
    });
});
