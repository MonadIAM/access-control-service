import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { bootstrap } from "@monadiam/shared/datasets/access-control";

import { RoleActorType, RoleArchetype, SYSTEM_REALM_ID } from "~context/enums";
import { RealmUnitHelpers } from "~testing/unit/domain-service/realm.helpers";

/* eslint-disable prettier/prettier */
const ACTOR_ID        = "00000000-0000-4000-8000-500000000001";
const REALM_ID        = "00000000-0000-4000-8000-500000000002";
const SECOND_REALM_ID = "00000000-0000-4000-8000-500000000003";
/* eslint-enable prettier/prettier */

const helpers = new RealmUnitHelpers();

describe("[DomainService] - Realm", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - throws when the actor realm limit would be exceeded", async () => {
            // Arrange
            const { service, repositories, transaction } = helpers.service();
            repositories.realms.wouldExceedRealmLimit.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create({
                input: { code: "realm.created", name: "Created Realm" },
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
            });

            // Assert
            await expect(result).rejects.toThrow("services.realm.LIMIT_EXCEEDED");
            expect(repositories.realms.wouldExceedRealmLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                account: ACTOR_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - persists a realm, creates base roles, assigns permissions and admin role, and returns the bootstrap result", async () => {
            // Arrange
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const permissions = bootstrap.ADMIN_PERMISSION_CODES.map((code) =>
                helpers.createPermission({ code, realm: systemRealm }),
            );
            const { service, transaction } = helpers.service({ permissions });
            const createBaseRolesSpy = jest.spyOn(service, "createBaseRoles");
            const assignBasePermissionsSpy = jest.spyOn(service, "assignBasePermissions");
            const assignBaseRolesSpy = jest.spyOn(service, "assignBaseRoles");

            // Act
            const result = await service.create({
                input: { description: "Created for tests", code: "realm.created", name: "Created Realm" },
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
            });

            // Assert
            expect(result.realm).toEqual(
                expect.objectContaining({
                    description: "Created for tests",
                    code: "realm.created",
                    name: "Created Realm",
                    owner: ACTOR_ID,
                }),
            );
            expect(transaction.persist).toHaveBeenNthCalledWith(1, result.realm);
            expect(createBaseRolesSpy).toHaveBeenCalledTimes(1);
            expect(assignBasePermissionsSpy).toHaveBeenCalledTimes(1);
            expect(assignBaseRolesSpy).toHaveBeenCalledTimes(1);
            expect(result.roles).toHaveLength(3);
            expect(result.paths).toHaveLength(5);
            expect(result.assignments.role).toHaveLength(1);
            expect(result.assignments.permission).toHaveLength(
                bootstrap.ADMIN_PERMISSION_CODES.length + bootstrap.USER_PERMISSION_CODES.length,
            );
        });
    });

    describe("[Method] - createBaseRoles", () => {
        it("[case] - creates root, user and admin roles with expected defaults", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const { service, transaction } = helpers.service({ realm });

            // Act
            const result = service.createBaseRoles({
                input: { code: "realm.main", name: "Main Realm" },
                transaction: transaction.entityManager,
                realm,
            });

            // Assert
            expect(result.roles.root).toEqual(
                expect.objectContaining({
                    description: "Role not available to users",
                    archetype: RoleArchetype.COMPOSITE,
                    actorType: RoleActorType.HUMAN,
                    name: "Main Realm System",
                    code: "realm.main.root",
                    realm,
                }),
            );
            expect(result.roles.user).toEqual(
                expect.objectContaining({
                    description: "Basic role for all users",
                    archetype: RoleArchetype.COMPOSITE,
                    actorType: RoleActorType.HUMAN,
                    code: "realm.main.user",
                    name: "Main Realm User",
                    realm,
                }),
            );
            expect(result.roles.admin).toEqual(
                expect.objectContaining({
                    description: "The role that grants maximum privileges",
                    archetype: RoleArchetype.COMPOSITE,
                    code: "realm.main.administrator",
                    name: "Main Realm Administrator",
                    actorType: RoleActorType.HUMAN,
                    realm,
                }),
            );
            expect(transaction.persist).toHaveBeenNthCalledWith(1, result.roles.root);
            expect(transaction.persist).toHaveBeenNthCalledWith(2, result.roles.user);
            expect(transaction.persist).toHaveBeenNthCalledWith(3, result.roles.admin);
        });

        it("[case] - creates self paths and root-to-user/root-to-admin hierarchy paths", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const { service, transaction } = helpers.service({ realm });

            // Act
            const { roles, paths } = service.createBaseRoles({
                input: { code: "realm.main", name: "Main Realm" },
                transaction: transaction.entityManager,
                realm,
            });

            // Assert
            expect(paths).toEqual([
                expect.objectContaining({ ancestor: roles.root, descendant: roles.root, depth: 0, realm }),
                expect.objectContaining({ ancestor: roles.user, descendant: roles.user, depth: 0, realm }),
                expect.objectContaining({ ancestor: roles.root, descendant: roles.user, depth: 1, realm }),
                expect.objectContaining({ ancestor: roles.admin, descendant: roles.admin, depth: 0, realm }),
                expect.objectContaining({ ancestor: roles.root, descendant: roles.admin, depth: 1, realm }),
            ]);
            expect(transaction.persist).toHaveBeenNthCalledWith(4, paths[0]);
            expect(transaction.persist).toHaveBeenNthCalledWith(8, paths[4]);
        });
    });

    describe("[Method] - assignBaseRoles", () => {
        it("[case] - creates and persists an admin role assignment for the actor", () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const roles = {
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
                admin: helpers.createRole({ code: "realm.admin", realm }),
            };
            const { service, transaction } = helpers.service({ realm, roles: Object.values(roles) });

            // Act
            const result = service.assignBaseRoles({
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
                realm,
                roles,
            });

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(expect.objectContaining({ account: ACTOR_ID, role: roles.admin, realm }));
            expect(transaction.persist).toHaveBeenCalledWith(result[0]);
        });
    });

    describe("[Method] - assignBasePermissions", () => {
        it("[case] - throws when not all system admin permissions are found", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const roles = {
                admin: helpers.createRole({ code: "realm.admin", realm }),
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
            };
            const { service, repositories, transaction } = helpers.service({ permissions: [], realm });

            // Act
            const result = service.assignBasePermissions({ transaction: transaction.entityManager, roles, realm });

            // Assert
            await expect(result).rejects.toThrow("services.realm.MISSING_SYSTEM_PERMISSIONS");
            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { code: { $in: bootstrap.ADMIN_PERMISSION_CODES }, realm: SYSTEM_REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - creates admin assignments for all system admin permissions", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const roles = {
                admin: helpers.createRole({ code: "realm.admin", realm }),
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
            };
            const permissions = bootstrap.ADMIN_PERMISSION_CODES.map((code) =>
                helpers.createPermission({ code, realm: systemRealm }),
            );
            const { service, transaction } = helpers.service({ permissions, realm });

            // Act
            const result = await service.assignBasePermissions({ transaction: transaction.entityManager, roles, realm });
            const adminAssignments = result.filter(({ role }) => role === roles.admin);

            // Assert
            expect(adminAssignments).toHaveLength(bootstrap.ADMIN_PERMISSION_CODES.length);
            expect(adminAssignments.map(({ permission }) => permission.code)).toEqual(bootstrap.ADMIN_PERMISSION_CODES);
        });

        it("[case] - creates user assignments only for system user permissions", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const roles = {
                admin: helpers.createRole({ code: "realm.admin", realm }),
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
            };
            const permissions = bootstrap.ADMIN_PERMISSION_CODES.map((code) =>
                helpers.createPermission({ code, realm: systemRealm }),
            );
            const { service, transaction } = helpers.service({ permissions, realm });

            // Act
            const result = await service.assignBasePermissions({ transaction: transaction.entityManager, roles, realm });
            const userAssignments = result.filter(({ role }) => role === roles.user);

            // Assert
            expect(userAssignments).toHaveLength(bootstrap.USER_PERMISSION_CODES.length);
            expect(userAssignments.map(({ permission }) => permission.code)).toEqual(bootstrap.USER_PERMISSION_CODES);
        });

        it("[case] - ignores duplicate permission codes from foreign custom realms by querying only system realm permissions", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const foreignRealm = helpers.createRealm({ id: SECOND_REALM_ID, code: "realm.foreign" });
            const roles = {
                admin: helpers.createRole({ code: "realm.admin", realm }),
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
            };
            const systemPermissions = bootstrap.ADMIN_PERMISSION_CODES.map((code) =>
                helpers.createPermission({ code, realm: systemRealm }),
            );
            const foreignPermission = helpers.createPermission({
                code: bootstrap.ADMIN_PERMISSION_CODES[0],
                realm: foreignRealm,
            });
            const { service, repositories, transaction } = helpers.service({
                permissions: [foreignPermission, ...systemPermissions],
                realm,
            });
            repositories.permissions.find.mockImplementation(() => Promise.resolve(systemPermissions));

            // Act
            const result = await service.assignBasePermissions({ transaction: transaction.entityManager, roles, realm });

            // Assert
            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { code: { $in: bootstrap.ADMIN_PERMISSION_CODES }, realm: SYSTEM_REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(result.filter(({ role }) => role === roles.admin).map(({ permission }) => permission.realm)).toEqual(
                systemPermissions.map(({ realm }) => realm),
            );
        });
    });

    describe("[Method] - update", () => {
        it("[case] - finds a realm and applies the patch", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const { service, repositories, transaction } = helpers.service({ realm });
            const updateSpy = jest.spyOn(realm, "update");

            // Act
            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated Realm" },
                id: REALM_ID,
            });

            // Assert
            expect(repositories.realms.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { id: REALM_ID },
            });
            expect(updateSpy).toHaveBeenCalledWith({ patch: { name: "Updated Realm" } });
        });
    });

    describe("[Behavior] - revocation", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
        ] as const)("[case] - processes and returns the batch ($method)", async ({ method, isRevoked }) => {
            // Arrange
            const first = helpers.createRealm({ id: REALM_ID, isRevoked });
            const second = helpers.createRealm({ id: SECOND_REALM_ID, isRevoked });
            const { service, repositories, transaction } = helpers.service({ realm: first });
            const firstOperationSpy = jest.spyOn(first, method);
            const secondOperationSpy = jest.spyOn(second, method);
            repositories.realms.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service[method]({
                identifiers: [REALM_ID, SECOND_REALM_ID],
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
                global: false,
            });

            // Assert
            expect(repositories.realms.find).toHaveBeenCalledWith({
                where: { id: { $in: [REALM_ID, SECOND_REALM_ID] }, owner: ACTOR_ID },
                options: expect.objectContaining({ refresh: true }),
                transaction: transaction.entityManager,
            });
            expect(firstOperationSpy).toHaveBeenCalledTimes(1);
            expect(secondOperationSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - checks purge eligibility, removes found realms, and returns them", async () => {
            // Arrange
            const first = helpers.createRealm({ id: REALM_ID, isRevoked: true });
            const second = helpers.createRealm({ id: SECOND_REALM_ID, isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ realm: first });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");
            repositories.realms.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service.purge({
                identifiers: [REALM_ID, SECOND_REALM_ID],
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
                global: false,
            });

            // Assert
            expect(repositories.realms.find).toHaveBeenCalledWith({
                where: { id: { $in: [REALM_ID, SECOND_REALM_ID] }, owner: ACTOR_ID },
                options: expect.objectContaining({ refresh: true }),
                transaction: transaction.entityManager,
            });
            expect(firstCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(secondCanPurgeSpy).toHaveBeenCalledTimes(1);
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
            const realm = helpers.createRealm({ id: REALM_ID, isRevoked });
            const { service, repositories, transaction } = helpers.service({ realm });
            repositories.realms.find.mockImplementation(() => Promise.resolve([realm]));

            // Act
            const result = await service[method]({
                transaction: transaction.entityManager,
                identifiers: [REALM_ID, REALM_ID],
                actor: ACTOR_ID,
                global: false,
            });

            // Assert
            expect(result).toEqual([realm]);
            expect(repositories.realms.find).toHaveBeenCalledWith({
                options: expect.objectContaining({ refresh: true }),
                where: { id: { $in: [REALM_ID] }, owner: ACTOR_ID },
                transaction: transaction.entityManager,
            });
        });
    });
});
