import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { PermissionOverrideUnitHelpers } from "~testing/unit/domain-service/permission-override.helpers";
import { PermissionOverrideEffect, SYSTEM_REALM_ID } from "~context/enums";

import { PermissionOverride } from "../entities";

/* eslint-disable prettier/prettier */
const REALM_ID           = "00000000-0000-4000-8000-400000000001";
const FOREIGN_REALM_ID   = "00000000-0000-4000-8000-400000000002";
const ACCOUNT_ID         = "00000000-0000-4000-8000-400000000003";
const PERMISSION_ID      = "00000000-0000-4000-8000-400000000004";
const OVERRIDE_ID        = "00000000-0000-4000-8000-400000000005";
const SECOND_OVERRIDE_ID = "00000000-0000-4000-8000-400000000006";
/* eslint-enable prettier/prettier */

const helpers = new PermissionOverrideUnitHelpers();

describe("PermissionOverrideService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when the account override limit would be exceeded", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const permission = helpers.createPermission({ id: PERMISSION_ID, realm });
            const { service, repositories, transaction } = helpers.service({ permissions: [permission], realm });
            repositories.permissionOverrides.wouldExceedOverrideLimit.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                    input: {
                        effect: PermissionOverrideEffect.ALLOW,
                        justification: "temporary override",
                        permission: PERMISSION_ID,
                        account: ACCOUNT_ID,
                    },
                }),
            ).rejects.toThrow("services.permission-override.LIMIT_EXCEEDED");

            expect(repositories.permissions.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: PERMISSION_ID, realm: { $in: [REALM_ID, SYSTEM_REALM_ID] } },
                transaction: transaction.entityManager,
            });
            expect(repositories.permissionOverrides.wouldExceedOverrideLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                account: ACCOUNT_ID,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates an override, validates create eligibility, persists it, and returns it", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const permission = helpers.createPermission({ id: PERMISSION_ID, realm });
            const { service, transaction } = helpers.service({ permissions: [permission], realm });
            const canCreateSpy = jest.spyOn(PermissionOverride.prototype, "canCreate");

            const result = await service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    justification: "deny for investigation",
                    effect: PermissionOverrideEffect.DENY,
                    permission: PERMISSION_ID,
                    account: ACCOUNT_ID,
                },
            });

            expect(result).toEqual(
                expect.objectContaining({
                    justification: "deny for investigation",
                    effect: PermissionOverrideEffect.DENY,
                    account: ACCOUNT_ID,
                    permission,
                    realm,
                }),
            );
            expect(canCreateSpy).toHaveBeenCalledTimes(1);
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });

        it("looks up permission only in the target and system realms", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const foreignRealm = helpers.createRealm({ id: FOREIGN_REALM_ID, code: "realm.foreign" });
            const foreignPermission = helpers.createPermission({ id: PERMISSION_ID, realm: foreignRealm });
            const { service, repositories, transaction } = helpers.service({ permissions: [foreignPermission], realm });
            repositories.permissions.findUniqueOrThrow.mockImplementation(() =>
                Promise.reject(new Error("permission out of scope")),
            );

            await expect(
                service.create({
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                    input: {
                        effect: PermissionOverrideEffect.ALLOW,
                        justification: "foreign permission",
                        permission: PERMISSION_ID,
                        account: ACCOUNT_ID,
                    },
                }),
            ).rejects.toThrow("permission out of scope");

            expect(repositories.permissions.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: PERMISSION_ID, realm: { $in: [REALM_ID, SYSTEM_REALM_ID] } },
                transaction: transaction.entityManager,
            });
            expect(repositories.permissionOverrides.wouldExceedOverrideLimit).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });
    });

    describe("revoke / restore", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
        ] as const)("$method processes each found entity and returns the batch", async ({ method, isRevoked }) => {
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createPermissionOverride({ id: OVERRIDE_ID, isRevoked });
            const second = helpers.createPermissionOverride({ id: SECOND_OVERRIDE_ID, isRevoked });
            const firstOperationSpy = jest.spyOn(first, method);
            const secondOperationSpy = jest.spyOn(second, method);
            repositories.permissionOverrides.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service[method]({
                identifiers: [OVERRIDE_ID, SECOND_OVERRIDE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.permissionOverrides.find).toHaveBeenCalledWith({
                where: { id: { $in: [OVERRIDE_ID, SECOND_OVERRIDE_ID] }, realm: REALM_ID },
                options: { populate: ["permission.realm"] },
                transaction: transaction.entityManager,
            });
            expect(firstOperationSpy).toHaveBeenCalledTimes(1);
            expect(secondOperationSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("expire", () => {
        it("merges and revokes each provided override", () => {
            const { service, transaction } = helpers.service();
            const first = helpers.createPermissionOverride({ id: OVERRIDE_ID });
            const second = helpers.createPermissionOverride({ id: SECOND_OVERRIDE_ID });
            const firstRevokeSpy = jest.spyOn(first, "revoke");
            const secondRevokeSpy = jest.spyOn(second, "revoke");

            service.expire({ transaction: transaction.entityManager, entities: [first, second] });

            expect(transaction.merge).toHaveBeenNthCalledWith(1, first);
            expect(transaction.merge).toHaveBeenNthCalledWith(2, second);
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("purge", () => {
        it("checks purge eligibility, removes found overrides, and returns them", async () => {
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createPermissionOverride({ id: OVERRIDE_ID, isRevoked: true });
            const second = helpers.createPermissionOverride({ id: SECOND_OVERRIDE_ID, isRevoked: true });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");
            repositories.permissionOverrides.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.purge({
                identifiers: [OVERRIDE_ID, SECOND_OVERRIDE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.permissionOverrides.find).toHaveBeenCalledWith({
                where: { id: { $in: [OVERRIDE_ID, SECOND_OVERRIDE_ID] }, realm: REALM_ID },
                options: { populate: ["permission.realm"] },
                transaction: transaction.entityManager,
            });
            expect(firstCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(secondCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenNthCalledWith(1, first);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, second);
            expect(result).toEqual([first, second]);
        });
    });

    describe("clean", () => {
        it("finds account overrides in an optional realm, removes them, and returns them", async () => {
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createPermissionOverride({ id: OVERRIDE_ID });
            const second = helpers.createPermissionOverride({ id: SECOND_OVERRIDE_ID });
            repositories.permissionOverrides.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.clean({
                input: { account: ACCOUNT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.permissionOverrides.find).toHaveBeenCalledWith({
                options: { populate: ["permission.realm", "realm"] },
                where: { account: ACCOUNT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenNthCalledWith(1, first);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, second);
            expect(result).toEqual([first, second]);
        });
    });

    describe("bulk identifiers", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
            { method: "purge", isRevoked: true },
        ] as const)("$method deduplicates repository lookup", async ({ method, isRevoked }) => {
            const { service, repositories, transaction } = helpers.service();
            const override = helpers.createPermissionOverride({ id: OVERRIDE_ID, isRevoked });
            repositories.permissionOverrides.find.mockImplementation(() => Promise.resolve([override]));

            const result = await service[method]({
                identifiers: [OVERRIDE_ID, OVERRIDE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(result).toEqual([override]);
            expect(repositories.permissionOverrides.find).toHaveBeenCalledWith({
                where: { id: { $in: [OVERRIDE_ID] }, realm: REALM_ID },
                options: { populate: ["permission.realm"] },
                transaction: transaction.entityManager,
            });
        });
    });
});
