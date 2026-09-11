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

describe("PermissionService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when the realm permission limit would be exceeded", async () => {
            const { service, repositories, transaction } = createServiceContext();
            repositories.permissions.wouldExceedPermissionLimit.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    input: { code: "permission.new", name: "New Permission" },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.permission.LIMIT_EXCEEDED");

            expect(repositories.permissions.wouldExceedPermissionLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates a permission in the realm and persists it", async () => {
            const realm = createRealm();
            const { service, transaction } = createServiceContext({ realm });

            const result = await service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    description: "Allows a new action",
                    code: "permission.new",
                    name: "New Permission",
                },
            });

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

    describe("update", () => {
        it("finds a permission in the realm and applies the patch", async () => {
            const permission = createPermission();
            const { service, repositories, transaction } = createServiceContext({
                permissions: [permission],
                realm: permission.realm,
            });
            const updateSpy = jest.spyOn(permission, "update");

            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated Permission" },
                id: PERMISSION_ID,
                realm: REALM_ID,
            });

            expect(repositories.permissions.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: PERMISSION_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(updateSpy).toHaveBeenCalledWith({ patch: { name: "Updated Permission" } });
        });
    });

    describe("revoke", () => {
        it("revokes found permissions and returns them", async () => {
            const realm = createRealm();
            const permission = createPermission({ realm });
            const secondPermission = createSecondPermission({ realm });
            const { service, repositories, transaction } = createServiceContext({
                permissions: [permission, secondPermission],
                realm,
            });
            const firstRevokeSpy = jest.spyOn(permission, "revoke");
            const secondRevokeSpy = jest.spyOn(secondPermission, "revoke");

            const result = await service.revoke({
                identifiers: [PERMISSION_ID, SECOND_PERMISSION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { id: { $in: [PERMISSION_ID, SECOND_PERMISSION_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([permission, secondPermission]);
        });
    });

    describe("restore", () => {
        it("restores found permissions and returns them", async () => {
            const realm = createRealm();
            const permission = createPermission({ realm });
            const secondPermission = createSecondPermission({ realm });
            const { service, repositories, transaction } = createServiceContext({
                permissions: [permission, secondPermission],
                realm,
            });
            permission.isRevoked = true;
            secondPermission.isRevoked = true;
            const firstRestoreSpy = jest.spyOn(permission, "restore");
            const secondRestoreSpy = jest.spyOn(secondPermission, "restore");

            const result = await service.restore({
                identifiers: [PERMISSION_ID, SECOND_PERMISSION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { id: { $in: [PERMISSION_ID, SECOND_PERMISSION_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstRestoreSpy).toHaveBeenCalledTimes(1);
            expect(secondRestoreSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([permission, secondPermission]);
        });
    });

    describe("purge", () => {
        it("checks purge eligibility, removes permissions, and returns them", async () => {
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

            const result = await service.purge({
                identifiers: [PERMISSION_ID, SECOND_PERMISSION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

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

    describe("bulk identifiers", () => {
        it.each([
            {
                name: "bulk identifiers: PermissionService.revoke deduplicates repository lookup",
                run: async () => {
                    const realm = createRealm();
                    const permission = createPermission({ realm });
                    const { service, repositories, transaction } = createServiceContext({
                        permissions: [permission],
                        realm,
                    });

                    await expect(
                        service.revoke({
                            identifiers: [PERMISSION_ID, PERMISSION_ID],
                            transaction: transaction.entityManager,
                            realm: REALM_ID,
                        }),
                    ).resolves.toEqual([permission]);

                    expect(repositories.permissions.find).toHaveBeenCalledWith({
                        where: { id: { $in: [PERMISSION_ID] }, realm: REALM_ID },
                        transaction: transaction.entityManager,
                    });
                },
            },
            {
                name: "bulk identifiers: PermissionService.restore deduplicates repository lookup",
                run: async () => {
                    const realm = createRealm();
                    const permission = createPermission({ realm, isRevoked: true });
                    const { service, repositories, transaction } = createServiceContext({
                        permissions: [permission],
                        realm,
                    });

                    await expect(
                        service.restore({
                            identifiers: [PERMISSION_ID, PERMISSION_ID],
                            transaction: transaction.entityManager,
                            realm: REALM_ID,
                        }),
                    ).resolves.toEqual([permission]);

                    expect(repositories.permissions.find).toHaveBeenCalledWith({
                        where: { id: { $in: [PERMISSION_ID] }, realm: REALM_ID },
                        transaction: transaction.entityManager,
                    });
                },
            },
            {
                name: "bulk identifiers: PermissionService.purge deduplicates repository lookup",
                run: async () => {
                    const realm = createRealm();
                    const permission = createPermission({ realm, isRevoked: true });
                    const { service, repositories, transaction } = createServiceContext({
                        permissions: [permission],
                        realm,
                    });

                    await expect(
                        service.purge({
                            identifiers: [PERMISSION_ID, PERMISSION_ID],
                            transaction: transaction.entityManager,
                            realm: REALM_ID,
                        }),
                    ).resolves.toEqual([permission]);

                    expect(repositories.permissions.find).toHaveBeenCalledWith({
                        where: { id: { $in: [PERMISSION_ID] }, realm: REALM_ID },
                        transaction: transaction.entityManager,
                    });
                },
            },
        ])("$name", async ({ run }) => {
            await run();
        });
    });
});
