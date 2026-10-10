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

describe("[DomainService] - PermissionOverride", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - throws when the account override limit would be exceeded", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const permission = helpers.createPermission({ id: PERMISSION_ID, realm });
            const { service, repositories, transaction } = helpers.service({ permissions: [permission], realm });
            repositories.permissionOverrides.wouldExceedOverrideLimit.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    effect: PermissionOverrideEffect.ALLOW,
                    justification: "temporary override",
                    permission: PERMISSION_ID,
                    account: ACCOUNT_ID,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.permission-override.LIMIT_EXCEEDED");
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

        it("[case] - creates an override, validates create eligibility, persists it, and returns it", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const permission = helpers.createPermission({ id: PERMISSION_ID, realm });
            const { service, transaction } = helpers.service({ permissions: [permission], realm });
            const canCreateSpy = jest.spyOn(PermissionOverride.prototype, "canCreate");

            // Act
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

            // Assert
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

        it("[case] - looks up permission only in the target and system realms", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const foreignRealm = helpers.createRealm({ id: FOREIGN_REALM_ID, code: "realm.foreign" });
            const foreignPermission = helpers.createPermission({ id: PERMISSION_ID, realm: foreignRealm });
            const { service, repositories, transaction } = helpers.service({ permissions: [foreignPermission], realm });
            repositories.permissions.findUniqueOrThrow.mockImplementation(() =>
                Promise.reject(new Error("permission out of scope")),
            );

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    effect: PermissionOverrideEffect.ALLOW,
                    justification: "foreign permission",
                    permission: PERMISSION_ID,
                    account: ACCOUNT_ID,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("permission out of scope");
            expect(repositories.permissions.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: PERMISSION_ID, realm: { $in: [REALM_ID, SYSTEM_REALM_ID] } },
                transaction: transaction.entityManager,
            });
            expect(repositories.permissionOverrides.wouldExceedOverrideLimit).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });
    });

    describe("[Behavior] - revocation", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
        ] as const)("[case] - processes and returns the batch ($method)", async ({ method, isRevoked }) => {
            // Arrange
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createPermissionOverride({ id: OVERRIDE_ID, isRevoked });
            const second = helpers.createPermissionOverride({ id: SECOND_OVERRIDE_ID, isRevoked });
            const firstOperationSpy = jest.spyOn(first, method);
            const secondOperationSpy = jest.spyOn(second, method);
            repositories.permissionOverrides.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service[method]({
                identifiers: [OVERRIDE_ID, SECOND_OVERRIDE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
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

    describe("[Method] - expire", () => {
        it("[case] - merges and revokes each provided override", () => {
            // Arrange
            const { service, transaction } = helpers.service();
            const first = helpers.createPermissionOverride({ id: OVERRIDE_ID });
            const second = helpers.createPermissionOverride({ id: SECOND_OVERRIDE_ID });
            const firstRevokeSpy = jest.spyOn(first, "revoke");
            const secondRevokeSpy = jest.spyOn(second, "revoke");

            // Act
            service.expire({ transaction: transaction.entityManager, entities: [first, second] });

            // Assert
            expect(transaction.merge).toHaveBeenNthCalledWith(1, first);
            expect(transaction.merge).toHaveBeenNthCalledWith(2, second);
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - checks purge eligibility, removes found overrides, and returns them", async () => {
            // Arrange
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createPermissionOverride({ id: OVERRIDE_ID, isRevoked: true });
            const second = helpers.createPermissionOverride({ id: SECOND_OVERRIDE_ID, isRevoked: true });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");
            repositories.permissionOverrides.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service.purge({
                identifiers: [OVERRIDE_ID, SECOND_OVERRIDE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
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

    describe("[Method] - clean", () => {
        it("[case] - finds account overrides in an optional realm, removes them, and returns them", async () => {
            // Arrange
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createPermissionOverride({ id: OVERRIDE_ID });
            const second = helpers.createPermissionOverride({ id: SECOND_OVERRIDE_ID });
            repositories.permissionOverrides.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service.clean({
                input: { account: ACCOUNT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });

            // Assert
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

    describe("[Behavior] - bulk identifiers", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
            { method: "purge", isRevoked: true },
        ] as const)("[case] - deduplicates repository lookup ($method)", async ({ method, isRevoked }) => {
            // Arrange
            const { service, repositories, transaction } = helpers.service();
            const override = helpers.createPermissionOverride({ id: OVERRIDE_ID, isRevoked });
            repositories.permissionOverrides.find.mockImplementation(() => Promise.resolve([override]));

            // Act
            const result = await service[method]({
                identifiers: [OVERRIDE_ID, OVERRIDE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(result).toEqual([override]);
            expect(repositories.permissionOverrides.find).toHaveBeenCalledWith({
                where: { id: { $in: [OVERRIDE_ID] }, realm: REALM_ID },
                options: { populate: ["permission.realm"] },
                transaction: transaction.entityManager,
            });
        });
    });
});
