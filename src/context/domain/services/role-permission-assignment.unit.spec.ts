import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { RolePermissionAssignmentUnitHelpers } from "~testing/unit/domain-service/role-permission-assignment.helpers";
import { SYSTEM_REALM_ID } from "~context/enums";

import { RolePermissionAssignment } from "../entities";

/* eslint-disable prettier/prettier */
const REALM_ID             = "00000000-0000-4000-8000-300000000001";
const ROLE_ID              = "00000000-0000-4000-8000-300000000002";
const PERMISSION_ID        = "00000000-0000-4000-8000-300000000003";
const SECOND_PERMISSION_ID = "00000000-0000-4000-8000-300000000004";
const ASSIGNMENT_ID        = "00000000-0000-4000-8000-300000000005";
const SECOND_ASSIGNMENT_ID = "00000000-0000-4000-8000-300000000006";
/* eslint-enable prettier/prettier */

const helpers = new RolePermissionAssignmentUnitHelpers();

describe("RolePermissionAssignmentService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when not all permissions are found in the target or system realm", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });
            const permission = helpers.createPermission({ id: PERMISSION_ID, realm });
            const secondPermission = helpers.createPermission({
                code: "permission.second",
                id: SECOND_PERMISSION_ID,
                realm,
            });
            const { service, repositories, transaction } = helpers.service({
                permissions: [permission, secondPermission],
                roles: [role],
                realm,
            });
            repositories.permissions.find.mockImplementation(() => Promise.resolve([permission]));

            await expect(
                service.create({
                    input: { role: ROLE_ID, permissions: [PERMISSION_ID, SECOND_PERMISSION_ID] },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.role-permission-assignment.PERMISSIONS_NOT_FOUND");

            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { id: { $in: [PERMISSION_ID, SECOND_PERMISSION_ID] }, realm: { $in: [REALM_ID, SYSTEM_REALM_ID] } },
                transaction: transaction.entityManager,
            });
            expect(repositories.rolePermissionAssignments.wouldExceedPermissionLimit).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("throws when the role permission limit would be exceeded", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });
            const permission = helpers.createPermission({ id: PERMISSION_ID, realm });
            const secondPermission = helpers.createPermission({
                code: "permission.second",
                id: SECOND_PERMISSION_ID,
                realm,
            });
            const { service, repositories, transaction } = helpers.service({
                permissions: [permission, secondPermission],
                roles: [role],
                realm,
            });
            repositories.rolePermissionAssignments.wouldExceedPermissionLimit.mockImplementation(() =>
                Promise.resolve(true),
            );

            await expect(
                service.create({
                    input: { role: ROLE_ID, permissions: [PERMISSION_ID, SECOND_PERMISSION_ID] },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.role-permission-assignment.ROLE_PERMISSION_LIMIT_EXCEEDED");

            expect(repositories.rolePermissionAssignments.wouldExceedPermissionLimit).toHaveBeenCalledWith({
                permissions: [PERMISSION_ID, SECOND_PERMISSION_ID],
                transaction: transaction.entityManager,
                role: ROLE_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates assignments for custom and system permissions, validates assignability, and persists them", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const role = helpers.createRole({ id: ROLE_ID, realm });
            const permission = helpers.createPermission({ id: PERMISSION_ID, realm });
            const systemPermission = helpers.createPermission({
                code: "permission.system",
                id: SECOND_PERMISSION_ID,
                realm: systemRealm,
            });
            const { service, repositories, transaction } = helpers.service({
                permissions: [permission, systemPermission],
                roles: [role],
                realm,
            });
            const canAssignSpy = jest.spyOn(RolePermissionAssignment.prototype, "canAssign");

            const result = await service.create({
                input: { role: ROLE_ID, permissions: [PERMISSION_ID, SECOND_PERMISSION_ID] },
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.roles.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: ROLE_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { id: { $in: [PERMISSION_ID, SECOND_PERMISSION_ID] }, realm: { $in: [REALM_ID, SYSTEM_REALM_ID] } },
                transaction: transaction.entityManager,
            });
            expect(result).toHaveLength(2);
            expect(result.map(({ permission }) => permission)).toEqual([permission, systemPermission]);
            expect(result).toEqual([
                expect.objectContaining({ permission, realm, role }),
                expect.objectContaining({ permission: systemPermission, realm, role }),
            ]);
            expect(canAssignSpy).toHaveBeenCalledTimes(2);
            expect(transaction.persist).toHaveBeenNthCalledWith(1, result[0]);
            expect(transaction.persist).toHaveBeenNthCalledWith(2, result[1]);
        });
    });

    describe("revoke", () => {
        it("revokes found assignments and returns them", async () => {
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createRolePermissionAssignment({ id: ASSIGNMENT_ID });
            const second = helpers.createRolePermissionAssignment({ id: SECOND_ASSIGNMENT_ID });
            const firstRevokeSpy = jest.spyOn(first, "revoke");
            const secondRevokeSpy = jest.spyOn(second, "revoke");
            repositories.rolePermissionAssignments.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.revoke({
                identifiers: [ASSIGNMENT_ID, SECOND_ASSIGNMENT_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.rolePermissionAssignments.find).toHaveBeenCalledWith({
                where: { id: { $in: [ASSIGNMENT_ID, SECOND_ASSIGNMENT_ID] }, realm: REALM_ID },
                options: { populate: ["permission.realm"] },
                transaction: transaction.entityManager,
            });
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("restore", () => {
        it("restores found assignments and returns them", async () => {
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createRolePermissionAssignment({ id: ASSIGNMENT_ID, isRevoked: true });
            const second = helpers.createRolePermissionAssignment({ id: SECOND_ASSIGNMENT_ID, isRevoked: true });
            const firstRestoreSpy = jest.spyOn(first, "restore");
            const secondRestoreSpy = jest.spyOn(second, "restore");
            repositories.rolePermissionAssignments.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.restore({
                identifiers: [ASSIGNMENT_ID, SECOND_ASSIGNMENT_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.rolePermissionAssignments.find).toHaveBeenCalledWith({
                where: { id: { $in: [ASSIGNMENT_ID, SECOND_ASSIGNMENT_ID] }, realm: REALM_ID },
                options: { populate: ["permission.realm"] },
                transaction: transaction.entityManager,
            });
            expect(firstRestoreSpy).toHaveBeenCalledTimes(1);
            expect(secondRestoreSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("purge", () => {
        it("checks purge eligibility, removes found assignments, and returns them", async () => {
            const { service, repositories, transaction } = helpers.service();
            const first = helpers.createRolePermissionAssignment({ id: ASSIGNMENT_ID, isRevoked: true });
            const second = helpers.createRolePermissionAssignment({ id: SECOND_ASSIGNMENT_ID, isRevoked: true });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");
            repositories.rolePermissionAssignments.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.purge({
                identifiers: [ASSIGNMENT_ID, SECOND_ASSIGNMENT_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.rolePermissionAssignments.find).toHaveBeenCalledWith({
                where: { id: { $in: [ASSIGNMENT_ID, SECOND_ASSIGNMENT_ID] }, realm: REALM_ID },
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

    describe("bulk identifiers", () => {
        it.each([
            {
                name: "bulk identifiers: RolePermissionAssignmentService.revoke deduplicates repository lookup",
                run: async () => {
                    const { service, repositories, transaction } = helpers.service();
                    const assignment = helpers.createRolePermissionAssignment({ id: ASSIGNMENT_ID });
                    repositories.rolePermissionAssignments.find.mockImplementation(() => Promise.resolve([assignment]));

                    await expect(
                        service.revoke({
                            identifiers: [ASSIGNMENT_ID, ASSIGNMENT_ID],
                            transaction: transaction.entityManager,
                            realm: REALM_ID,
                        }),
                    ).resolves.toEqual([assignment]);

                    expect(repositories.rolePermissionAssignments.find).toHaveBeenCalledWith({
                        where: { id: { $in: [ASSIGNMENT_ID] }, realm: REALM_ID },
                        options: { populate: ["permission.realm"] },
                        transaction: transaction.entityManager,
                    });
                },
            },
            {
                name: "bulk identifiers: RolePermissionAssignmentService.restore deduplicates repository lookup",
                run: async () => {
                    const { service, repositories, transaction } = helpers.service();
                    const assignment = helpers.createRolePermissionAssignment({ id: ASSIGNMENT_ID, isRevoked: true });
                    repositories.rolePermissionAssignments.find.mockImplementation(() => Promise.resolve([assignment]));

                    await expect(
                        service.restore({
                            identifiers: [ASSIGNMENT_ID, ASSIGNMENT_ID],
                            transaction: transaction.entityManager,
                            realm: REALM_ID,
                        }),
                    ).resolves.toEqual([assignment]);

                    expect(repositories.rolePermissionAssignments.find).toHaveBeenCalledWith({
                        where: { id: { $in: [ASSIGNMENT_ID] }, realm: REALM_ID },
                        options: { populate: ["permission.realm"] },
                        transaction: transaction.entityManager,
                    });
                },
            },
            {
                name: "bulk identifiers: RolePermissionAssignmentService.purge deduplicates repository lookup",
                run: async () => {
                    const { service, repositories, transaction } = helpers.service();
                    const assignment = helpers.createRolePermissionAssignment({ id: ASSIGNMENT_ID, isRevoked: true });
                    repositories.rolePermissionAssignments.find.mockImplementation(() => Promise.resolve([assignment]));

                    await expect(
                        service.purge({
                            identifiers: [ASSIGNMENT_ID, ASSIGNMENT_ID],
                            transaction: transaction.entityManager,
                            realm: REALM_ID,
                        }),
                    ).resolves.toEqual([assignment]);

                    expect(repositories.rolePermissionAssignments.find).toHaveBeenCalledWith({
                        where: { id: { $in: [ASSIGNMENT_ID] }, realm: REALM_ID },
                        options: { populate: ["permission.realm"] },
                        transaction: transaction.entityManager,
                    });
                },
            },
        ])("$name", async ({ run }) => {
            await run();
        });
    });
});
