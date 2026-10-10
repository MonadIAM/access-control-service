import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { PermissionUnitHelpers } from "~testing/unit/domain-service/permission.helpers";

/* eslint-disable prettier/prettier */
const REALM_ID             = "00000000-0000-4000-8000-100000000001";
const PERMISSION_ID        = "00000000-0000-4000-8000-100000000002";
const SECOND_PERMISSION_ID = "00000000-0000-4000-8000-100000000003";
/* eslint-enable prettier/prettier */

const helpers = new PermissionUnitHelpers();

function createRealm(props: Partial<Entities.Realm.Contract> = {}): Entities.Realm {
    return helpers.createRealm({ id: REALM_ID, ...props });
}

function createPermission(props: Partial<Entities.Permission.Contract> = {}): Entities.Permission {
    return helpers.createPermission({
        realm: createRealm(),
        id: PERMISSION_ID,
        ...props,
    });
}

function createSecondPermission(props: Partial<Entities.Permission.Contract> = {}): Entities.Permission {
    return helpers.createPermission({
        code: "permission.second",
        id: SECOND_PERMISSION_ID,
        realm: createRealm(),
        ...props,
    });
}

function createServiceContext(props: Unit.Domain.Permission.Service.Props = {}): Unit.Domain.Permission.Service.Result {
    const realm = props.realm ?? createRealm();
    const permissions = props.permissions ?? [createPermission({ realm }), createSecondPermission({ realm })];

    return helpers.service({
        permissions,
        realm,
    });
}

describe("[DomainService] - Permission", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - throws when the realm permission limit would be exceeded", async () => {
            // Arrange
            const { service, repositories, transaction } = createServiceContext();
            repositories.permissions.wouldExceedPermissionLimit.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create({
                input: { code: "permission.new", name: "New Permission" },
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            await expect(result).rejects.toThrow("services.permission.LIMIT_EXCEEDED");
            expect(repositories.permissions.wouldExceedPermissionLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - creates a permission in the realm and persists it", async () => {
            // Arrange
            const realm = createRealm();
            const { service, transaction } = createServiceContext({ realm });

            // Act
            const result = await service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    description: "Allows a new action",
                    code: "permission.new",
                    name: "New Permission",
                },
            });

            // Assert
            expect(result).toEqual(
                expect.objectContaining({
                    description: "Allows a new action",
                    code: "permission.new",
                    name: "New Permission",
                    realm,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("[Method] - update", () => {
        it("[case] - finds a permission in the realm and applies the patch", async () => {
            // Arrange
            const permission = createPermission();
            const { service, repositories, transaction } = createServiceContext({
                permissions: [permission],
                realm: permission.realm,
            });
            const updateSpy = jest.spyOn(permission, "update");

            // Act
            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated Permission" },
                id: PERMISSION_ID,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.permissions.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: PERMISSION_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(updateSpy).toHaveBeenCalledWith({ patch: { name: "Updated Permission" } });
        });
    });

    describe("[Behavior] - revocation", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
        ] as const)("[case] - processes and returns the batch ($method)", async ({ method, isRevoked }) => {
            // Arrange
            const realm = createRealm();
            const permission = createPermission({ realm, isRevoked });
            const secondPermission = createSecondPermission({ realm, isRevoked });
            const { service, repositories, transaction } = createServiceContext({
                permissions: [permission, secondPermission],
                realm,
            });
            const firstOperationSpy = jest.spyOn(permission, method);
            const secondOperationSpy = jest.spyOn(secondPermission, method);

            // Act
            const result = await service[method]({
                identifiers: [PERMISSION_ID, SECOND_PERMISSION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { id: { $in: [PERMISSION_ID, SECOND_PERMISSION_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstOperationSpy).toHaveBeenCalledTimes(1);
            expect(secondOperationSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([permission, secondPermission]);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - checks purge eligibility, removes permissions, and returns them", async () => {
            // Arrange
            const realm = createRealm();
            const permission = createPermission({ realm });
            const secondPermission = createSecondPermission({ realm });
            const { service, repositories, transaction } = createServiceContext({
                permissions: [permission, secondPermission],
                realm,
            });
            permission.isRevoked = true;
            secondPermission.isRevoked = true;
            const firstCanPurgeSpy = jest.spyOn(permission, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(secondPermission, "canPurge");

            // Act
            const result = await service.purge({
                identifiers: [PERMISSION_ID, SECOND_PERMISSION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { id: { $in: [PERMISSION_ID, SECOND_PERMISSION_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.clear).not.toHaveBeenCalled();
            expect(firstCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(secondCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenNthCalledWith(1, permission);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, secondPermission);
            expect(result).toEqual([permission, secondPermission]);
        });
    });

    describe("[Behavior] - bulk identifiers", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
            { method: "purge", isRevoked: true },
        ] as const)("[case] - deduplicates repository lookup ($method)", async ({ method, isRevoked }) => {
            // Arrange
            const realm = createRealm();
            const permission = createPermission({ realm, isRevoked });
            const { service, repositories, transaction } = createServiceContext({
                permissions: [permission],
                realm,
            });

            // Act
            const result = await service[method]({
                identifiers: [PERMISSION_ID, PERMISSION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(result).toEqual([permission]);
            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { id: { $in: [PERMISSION_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
        });
    });
});
