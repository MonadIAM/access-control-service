import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { ADMIN_PERMISSION_CODES, USER_PERMISSION_CODES } from "~infrastructure/datasets/bootstrap";
import { RoleActorType, RoleArchetype, SYSTEM_REALM_ID } from "~context/enums";
import { RealmUnitHelpers } from "~testing/unit/domain-service/realm.helpers";

/* eslint-disable prettier/prettier */
const ACTOR_ID        = "00000000-0000-4000-8000-500000000001";
const REALM_ID        = "00000000-0000-4000-8000-500000000002";
const SECOND_REALM_ID = "00000000-0000-4000-8000-500000000003";
/* eslint-enable prettier/prettier */

const helpers = new RealmUnitHelpers();

describe("RealmService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when the actor realm limit would be exceeded", async () => {
            const { service, repositories, transaction } = helpers.service();
            repositories.realms.wouldExceedRealmLimit.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    input: { code: "realm.created", name: "Created Realm" },
                    transaction: transaction.entityManager,
                    actor: ACTOR_ID,
                }),
            ).rejects.toThrow("services.realm.LIMIT_EXCEEDED");

            expect(repositories.realms.wouldExceedRealmLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                account: ACTOR_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("persists a realm, creates base roles, assigns permissions and admin role, and returns the bootstrap result", async () => {
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const permissions = ADMIN_PERMISSION_CODES.map((code) =>
                helpers.createPermission({ code, realm: systemRealm }),
            );
            const { service, transaction } = helpers.service({ permissions });
            const createBaseRolesSpy = jest.spyOn(service, "createBaseRoles");
            const assignBasePermissionsSpy = jest.spyOn(service, "assignBasePermissions");
            const assignBaseRolesSpy = jest.spyOn(service, "assignBaseRoles");

            const result = await service.create({
                input: { description: "Created for tests", code: "realm.created", name: "Created Realm" },
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
            });

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
                ADMIN_PERMISSION_CODES.length + USER_PERMISSION_CODES.length,
            );
        });
    });

    describe("createBaseRoles", () => {
        it("creates root, user and admin roles with expected defaults", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const { service, transaction } = helpers.service({ realm });

            const result = service.createBaseRoles({
                input: { code: "realm.main", name: "Main Realm" },
                transaction: transaction.entityManager,
                realm,
            });

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

        it("creates self paths and root-to-user/root-to-admin hierarchy paths", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const { service, transaction } = helpers.service({ realm });

            const { roles, paths } = service.createBaseRoles({
                input: { code: "realm.main", name: "Main Realm" },
                transaction: transaction.entityManager,
                realm,
            });

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

    describe("assignBaseRoles", () => {
        it("creates and persists an admin role assignment for the actor", () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const roles = {
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
                admin: helpers.createRole({ code: "realm.admin", realm }),
            };
            const { service, transaction } = helpers.service({ realm, roles: Object.values(roles) });

            const result = service.assignBaseRoles({
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
                realm,
                roles,
            });

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(expect.objectContaining({ account: ACTOR_ID, role: roles.admin, realm }));
            expect(transaction.persist).toHaveBeenCalledWith(result[0]);
        });
    });

    describe("assignBasePermissions", () => {
        it("throws when not all system admin permissions are found", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const roles = {
                admin: helpers.createRole({ code: "realm.admin", realm }),
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
            };
            const { service, repositories, transaction } = helpers.service({ permissions: [], realm });

            await expect(
                service.assignBasePermissions({ transaction: transaction.entityManager, roles, realm }),
            ).rejects.toThrow("services.realm.MISSING_SYSTEM_PERMISSIONS");

            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { code: { $in: ADMIN_PERMISSION_CODES }, realm: SYSTEM_REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates admin assignments for all system admin permissions", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const roles = {
                admin: helpers.createRole({ code: "realm.admin", realm }),
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
            };
            const permissions = ADMIN_PERMISSION_CODES.map((code) =>
                helpers.createPermission({ code, realm: systemRealm }),
            );
            const { service, transaction } = helpers.service({ permissions, realm });

            const result = await service.assignBasePermissions({ transaction: transaction.entityManager, roles, realm });
            const adminAssignments = result.filter(({ role }) => role === roles.admin);

            expect(adminAssignments).toHaveLength(ADMIN_PERMISSION_CODES.length);
            expect(adminAssignments.map(({ permission }) => permission.code)).toEqual(ADMIN_PERMISSION_CODES);
        });

        it("creates user assignments only for system user permissions", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const roles = {
                admin: helpers.createRole({ code: "realm.admin", realm }),
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
            };
            const permissions = ADMIN_PERMISSION_CODES.map((code) =>
                helpers.createPermission({ code, realm: systemRealm }),
            );
            const { service, transaction } = helpers.service({ permissions, realm });

            const result = await service.assignBasePermissions({ transaction: transaction.entityManager, roles, realm });
            const userAssignments = result.filter(({ role }) => role === roles.user);

            expect(userAssignments).toHaveLength(USER_PERMISSION_CODES.length);
            expect(userAssignments.map(({ permission }) => permission.code)).toEqual(USER_PERMISSION_CODES);
        });

        it("ignores duplicate permission codes from foreign custom realms by querying only system realm permissions", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const systemRealm = helpers.createRealm({ id: SYSTEM_REALM_ID, code: "realm.system" });
            const foreignRealm = helpers.createRealm({ id: SECOND_REALM_ID, code: "realm.foreign" });
            const roles = {
                admin: helpers.createRole({ code: "realm.admin", realm }),
                root: helpers.createRole({ code: "realm.root", realm }),
                user: helpers.createRole({ code: "realm.user", realm }),
            };
            const systemPermissions = ADMIN_PERMISSION_CODES.map((code) =>
                helpers.createPermission({ code, realm: systemRealm }),
            );
            const foreignPermission = helpers.createPermission({ code: ADMIN_PERMISSION_CODES[0], realm: foreignRealm });
            const { service, repositories, transaction } = helpers.service({
                permissions: [foreignPermission, ...systemPermissions],
                realm,
            });
            repositories.permissions.find.mockImplementation(() => Promise.resolve(systemPermissions));

            const result = await service.assignBasePermissions({ transaction: transaction.entityManager, roles, realm });

            expect(repositories.permissions.find).toHaveBeenCalledWith({
                where: { code: { $in: ADMIN_PERMISSION_CODES }, realm: SYSTEM_REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(result.filter(({ role }) => role === roles.admin).map(({ permission }) => permission.realm)).toEqual(
                systemPermissions.map(({ realm }) => realm),
            );
        });
    });

    describe("update", () => {
        it("finds a realm and applies the patch", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const { service, repositories, transaction } = helpers.service({ realm });
            const updateSpy = jest.spyOn(realm, "update");

            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated Realm" },
                id: REALM_ID,
            });

            expect(repositories.realms.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { id: REALM_ID },
            });
            expect(updateSpy).toHaveBeenCalledWith({ patch: { name: "Updated Realm" } });
        });
    });

    describe("revoke", () => {
        it("revokes found realms and returns them", async () => {
            const first = helpers.createRealm({ id: REALM_ID });
            const second = helpers.createRealm({ id: SECOND_REALM_ID });
            const { service, repositories, transaction } = helpers.service({ realm: first });
            const firstRevokeSpy = jest.spyOn(first, "revoke");
            const secondRevokeSpy = jest.spyOn(second, "revoke");
            repositories.realms.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.revoke({
                identifiers: [REALM_ID, SECOND_REALM_ID],
                transaction: transaction.entityManager,
            });

            expect(repositories.realms.find).toHaveBeenCalledWith({
                where: { id: { $in: [REALM_ID, SECOND_REALM_ID] } },
                transaction: transaction.entityManager,
            });
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("restore", () => {
        it("restores found realms and returns them", async () => {
            const first = helpers.createRealm({ id: REALM_ID, isRevoked: true });
            const second = helpers.createRealm({ id: SECOND_REALM_ID, isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ realm: first });
            const firstRestoreSpy = jest.spyOn(first, "restore");
            const secondRestoreSpy = jest.spyOn(second, "restore");
            repositories.realms.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.restore({
                identifiers: [REALM_ID, SECOND_REALM_ID],
                transaction: transaction.entityManager,
            });

            expect(repositories.realms.find).toHaveBeenCalledWith({
                where: { id: { $in: [REALM_ID, SECOND_REALM_ID] } },
                transaction: transaction.entityManager,
            });
            expect(firstRestoreSpy).toHaveBeenCalledTimes(1);
            expect(secondRestoreSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("purge", () => {
        it("checks purge eligibility, removes found realms, and returns them", async () => {
            const first = helpers.createRealm({ id: REALM_ID, isRevoked: true });
            const second = helpers.createRealm({ id: SECOND_REALM_ID, isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ realm: first });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");
            repositories.realms.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.purge({
                identifiers: [REALM_ID, SECOND_REALM_ID],
                transaction: transaction.entityManager,
            });

            expect(repositories.realms.find).toHaveBeenCalledWith({
                where: { id: { $in: [REALM_ID, SECOND_REALM_ID] } },
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
                name: "bulk identifiers: RealmService.revoke deduplicates repository lookup",
                run: async () => {
                    const realm = helpers.createRealm({ id: REALM_ID });
                    const { service, repositories, transaction } = helpers.service({ realm });
                    repositories.realms.find.mockImplementation(() => Promise.resolve([realm]));

                    await expect(
                        service.revoke({
                            transaction: transaction.entityManager,
                            identifiers: [REALM_ID, REALM_ID],
                        }),
                    ).resolves.toEqual([realm]);

                    expect(repositories.realms.find).toHaveBeenCalledWith({
                        transaction: transaction.entityManager,
                        where: { id: { $in: [REALM_ID] } },
                    });
                },
            },
            {
                name: "bulk identifiers: RealmService.restore deduplicates repository lookup",
                run: async () => {
                    const realm = helpers.createRealm({ id: REALM_ID, isRevoked: true });
                    const { service, repositories, transaction } = helpers.service({ realm });
                    repositories.realms.find.mockImplementation(() => Promise.resolve([realm]));

                    await expect(
                        service.restore({
                            transaction: transaction.entityManager,
                            identifiers: [REALM_ID, REALM_ID],
                        }),
                    ).resolves.toEqual([realm]);

                    expect(repositories.realms.find).toHaveBeenCalledWith({
                        transaction: transaction.entityManager,
                        where: { id: { $in: [REALM_ID] } },
                    });
                },
            },
            {
                name: "bulk identifiers: RealmService.purge deduplicates repository lookup",
                run: async () => {
                    const realm = helpers.createRealm({ id: REALM_ID, isRevoked: true });
                    const { service, repositories, transaction } = helpers.service({ realm });
                    repositories.realms.find.mockImplementation(() => Promise.resolve([realm]));

                    await expect(
                        service.purge({
                            transaction: transaction.entityManager,
                            identifiers: [REALM_ID, REALM_ID],
                        }),
                    ).resolves.toEqual([realm]);

                    expect(repositories.realms.find).toHaveBeenCalledWith({
                        transaction: transaction.entityManager,
                        where: { id: { $in: [REALM_ID] } },
                    });
                },
            },
        ])("$name", async ({ run }) => {
            await run();
        });
    });
});
