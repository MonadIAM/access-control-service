import { describe, expect, it } from "@jest/globals";

import { PermissionQueriesUnitHelpers } from "~testing/unit/query-services/permission.helpers";
import { PrivilegeScope, QueryMode, ResponseViewType } from "~context/enums";
import { SYSTEM_REALM_ID } from "~context/constants";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new PermissionQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - Permission", () => {
    describe("[Method] - getPrivileges", () => {
        it("[case] - groups privileges by code across distinct session realms", async () => {
            // Arrange
            const { queries, cache } = helpers.queries();
            cache.collectPermissions.mockResolvedValue({
                realms: {
                    [REALM]: { read: PrivilegeScope.REALM, manage: PrivilegeScope.REALM },
                    "realm-b": { read: PrivilegeScope.REALM },
                },
                global: { manage: PrivilegeScope.GLOBAL },
            });

            // Act
            const result = await queries.getPrivileges({ account: ID, realms: [REALM, "realm-b", REALM] });

            // Assert
            expect(result).toEqual({
                read: [{ scope: PrivilegeScope.REALM, realms: [REALM, "realm-b"] }],
                manage: [{ scope: PrivilegeScope.GLOBAL }, { scope: PrivilegeScope.REALM, realms: [REALM] }],
            });
            expect(cache.collectPermissions).toHaveBeenCalledTimes(1);
            expect(cache.collectPermissions).toHaveBeenCalledWith({ account: ID, realms: [REALM, "realm-b"] });
        });

        it("[case] - preserves global operations independently of ordinary realm grants", async () => {
            // Arrange
            const { queries, cache } = helpers.queries();
            cache.collectPermissions.mockResolvedValue({
                realms: { [SYSTEM_REALM_ID]: { read: PrivilegeScope.REALM } },
                global: { read: PrivilegeScope.GLOBAL, manage: PrivilegeScope.GLOBAL },
            });

            // Act
            const result = await queries.getPrivileges({ account: ID, realms: [SYSTEM_REALM_ID] });

            // Assert
            expect(result).toEqual({
                read: [{ scope: PrivilegeScope.GLOBAL }, { scope: PrivilegeScope.REALM, realms: [SYSTEM_REALM_ID] }],
                manage: [{ scope: PrivilegeScope.GLOBAL }],
            });
        });

        it.each([
            { realms: [REALM] },
            { realms: [SYSTEM_REALM_ID, REALM] },
            { realms: [SYSTEM_REALM_ID, SYSTEM_REALM_ID] },
        ])("[case] - preserves global operations regardless of session realms ($realms)", async ({ realms }) => {
            // Arrange
            const { queries, cache } = helpers.queries();
            cache.collectPermissions.mockResolvedValue({
                realms: Object.fromEntries(realms.map((realm) => [realm, {}])),
                global: { read: PrivilegeScope.GLOBAL },
            });

            // Act
            const result = await queries.getPrivileges({ account: ID, realms });

            // Assert
            expect(result).toEqual({
                read: [{ scope: PrivilegeScope.GLOBAL }],
            });
        });

        it.each(["constructor", "toString", "__proto__"])("[case] - groups the permission code %s", async (code) => {
            // Arrange
            const { queries, cache } = helpers.queries();
            cache.collectPermissions.mockResolvedValue({
                realms: { [REALM]: { [code]: PrivilegeScope.REALM } },
                global: {},
            });

            // Act
            const result = await queries.getPrivileges({ account: ID, realms: [REALM] });

            // Assert
            expect(result).toEqual({ [code]: [{ scope: PrivilegeScope.REALM, realms: [REALM] }] });
            expect(JSON.parse(JSON.stringify(result))).toEqual({
                [code]: [{ scope: PrivilegeScope.REALM, realms: [REALM] }],
            });
        });

        it("[case] - returns an empty object for a session without grants", async () => {
            // Arrange
            const { queries, cache } = helpers.queries();
            cache.collectPermissions.mockResolvedValue({ realms: { [REALM]: {} }, global: {} });

            // Act
            const result = await queries.getPrivileges({ account: ID, realms: [REALM] });

            // Assert
            expect(result).toEqual({});
        });

        it("[case] - does not collect privileges outside an empty session realm list", async () => {
            // Arrange
            const { queries, cache } = helpers.queries();

            // Act
            const result = await queries.getPrivileges({ account: ID, realms: [] });

            // Assert
            expect(result).toEqual({});
            expect(cache.collectPermissions).not.toHaveBeenCalled();
        });

        it("[case] - propagates projection errors instead of returning an empty result", async () => {
            // Arrange
            const { queries, cache } = helpers.queries();
            const error = new Error("projection unavailable");
            cache.collectPermissions.mockRejectedValue(error);

            // Act
            const result = queries.getPrivileges({ account: ID, realms: [REALM] });

            // Assert
            await expect(result).rejects.toBe(error);
        });
    });

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
