import { bootstrap } from "@monadiam/shared/datasets/access-control";
import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { RoleArchetype, RealmType, PermissionCode, PermissionOverrideEffect } from "~context/enums";
import { RealmIntegrationHelpers } from "~testing/integration/domain-service/realm.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import {
    RolePermissionAssignment,
    AccountRoleAssignment,
    PermissionOverride,
    RoleClosure,
    Permission,
    Realm,
    Role,
} from "~context/domain/entities";

const helpers = new RealmIntegrationHelpers();

async function loadRealm(suite: Integration.Domain.Realm.Suite, id: string): Promise<Entities.Realm> {
    return await suite.transaction((transaction) => transaction.findOneOrFail(Realm, { id }));
}

async function loadRoles(suite: Integration.Domain.Realm.Suite, realm: string): Promise<Entities.Role[]> {
    return await suite.transaction((transaction) => transaction.find(Role, { realm }, { orderBy: { code: "asc" } }));
}

async function loadRoleAssignments(
    suite: Integration.Domain.Realm.Suite,
    realm: string,
): Promise<Entities.AccountRoleAssignment[]> {
    return await suite.transaction((transaction) =>
        transaction.find(AccountRoleAssignment, { realm }, { populate: ["role"], orderBy: { role: { code: "asc" } } }),
    );
}

async function loadPermissionAssignments(
    suite: Integration.Domain.Realm.Suite,
    realm: string,
): Promise<Entities.RolePermissionAssignment[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            RolePermissionAssignment,
            { realm },
            { populate: ["role", "permission"], orderBy: { role: { code: "asc" }, permission: { code: "asc" } } },
        ),
    );
}

async function countBootstrapRowsByCode(suite: Integration.Domain.Realm.Suite, code: string): Promise<number> {
    return await suite.transaction(async (transaction) => {
        const [realms, roles, roleAssignments, permissionAssignments] = await Promise.all([
            transaction.count(Realm, { code }),
            transaction.count(Role, { code: { $like: `${code}.%` } }),
            transaction.count(AccountRoleAssignment, { realm: { code } }),
            transaction.count(RolePermissionAssignment, { realm: { code } }),
        ]);

        return realms + roles + roleAssignments + permissionAssignments;
    });
}

async function countRealmGraphRows(suite: Integration.Domain.Realm.Suite, realm: Entities.Realm): Promise<number> {
    return await suite.transaction(async (transaction) => {
        const [realms, roles, roleClosures, roleAssignments, permissions, permissionAssignments] = await Promise.all([
            transaction.count(Realm, { id: realm.id }),
            transaction.count(Role, { realm: realm.id }),
            transaction.count(RoleClosure, { realm: realm.id }),
            transaction.count(AccountRoleAssignment, { realm: realm.id }),
            transaction.count(Permission, { realm: realm.id }),
            transaction.count(RolePermissionAssignment, { realm: realm.id }),
        ]);

        return realms + roles + roleClosures + roleAssignments + permissions + permissionAssignments;
    });
}

describe("[DomainService] - Realm", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates a persisted realm bootstrap with base roles and assignments", async () => {
            // Arrange
            await helpers.seedSystemPermissions(suite);
            const actor = randomUUID();

            // Act
            const result = await suite.transaction((transaction) =>
                suite.repository().realmService.create({
                    input: {
                        code: "customer",
                        name: "Customer",
                    },
                    transaction,
                    actor,
                }),
            );
            const realm = await loadRealm(suite, result.realm.id);
            const roles = await loadRoles(suite, realm.id);
            const roleAssignments = await loadRoleAssignments(suite, realm.id);
            const permissionAssignments = await loadPermissionAssignments(suite, realm.id);
            const adminAssignments = permissionAssignments.filter(({ role }) => role.code === "customer.administrator");
            const userAssignments = permissionAssignments.filter(({ role }) => role.code === "customer.user");

            // Assert
            expect(realm).toMatchObject({
                owner: actor,
                code: "customer",
                name: "Customer",
            });
            expect(roles.map(({ code }) => code)).toEqual(["customer.administrator", "customer.root", "customer.user"]);
            expect(roles.every(({ archetype }) => archetype === RoleArchetype.COMPOSITE)).toBe(true);
            expect(result.paths).toHaveLength(5);
            expect(roleAssignments).toHaveLength(1);
            expect(roleAssignments[0]).toMatchObject({
                account: actor,
                role: { code: "customer.administrator" },
            });
            expect(adminAssignments.map(({ permission }) => permission.code).sort()).toEqual(
                [...bootstrap.ADMIN_PERMISSION_CODES].sort(),
            );
            expect(userAssignments.map(({ permission }) => permission.code).sort()).toEqual(
                [...bootstrap.USER_PERMISSION_CODES].sort(),
            );
        });

        it("[case] - rolls back a partial bootstrap when a system permission is missing", async () => {
            // Arrange
            const systemRealm = await helpers.seedSystemPermissions(suite);
            const [missingCode] = bootstrap.ADMIN_PERMISSION_CODES;
            await suite.transaction(async (transaction) => {
                const permission = await transaction.findOneOrFail(Permission, {
                    code: missingCode,
                    realm: systemRealm.id,
                });

                transaction.remove(permission);
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().realmService.create({
                    input: {
                        code: "missing-permissions",
                        name: "Missing Permissions",
                    },
                    actor: randomUUID(),
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countBootstrapRowsByCode(suite, "missing-permissions");

            // Assert
            await expect(result).rejects.toThrow("services.realm.MISSING_SYSTEM_PERMISSIONS");
            expect(result2).toBe(0);
        });

        it("[case] - does not create a realm when the owner reaches the real realm limit", async () => {
            // Arrange
            await helpers.seedSystemPermissions(suite);
            const actor = randomUUID();
            await suite.fixtures().createRealm({ owner: actor, code: "limit.first" });
            await suite.fixtures().createRealm({ owner: actor, code: "limit.second" });
            await suite.fixtures().createRealm({ owner: actor, code: "limit.third" });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().realmService.create({
                    input: {
                        code: "limit.fourth",
                        name: "Fourth Realm",
                    },
                    transaction,
                    actor,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countBootstrapRowsByCode(suite, "limit.fourth");

            // Assert
            await expect(result).rejects.toThrow("services.realm.LIMIT_EXCEEDED");
            expect(result2).toBe(0);
        });

        it("[case] - uses only system permissions when another realm has the same permission code", async () => {
            // Arrange
            const systemRealm = await helpers.seedSystemPermissions(suite);
            const foreignRealm = await suite.fixtures().createRealm({
                code: "foreign",
                name: "Foreign",
            });
            await suite.fixtures().createPermission({
                code: bootstrap.ADMIN_PERMISSION_CODES[0],
                name: "Foreign Duplicate Permission",
                realm: foreignRealm,
            });

            // Act
            const result = await suite.transaction((transaction) =>
                suite.repository().realmService.create({
                    input: {
                        code: "isolated",
                        name: "Isolated",
                    },
                    actor: randomUUID(),
                    transaction,
                }),
            );
            const assignments = await loadPermissionAssignments(suite, result.realm.id);
            const assignedRealmIds = assignments.map(({ permission }) => permission.realm.id);

            // Assert
            expect(assignments).toHaveLength(
                bootstrap.ADMIN_PERMISSION_CODES.length + bootstrap.USER_PERMISSION_CODES.length,
            );
            expect(assignedRealmIds.every((realm) => realm === systemRealm.id)).toBe(true);
        });
    });

    describe("[Behavior] - bootstrap", () => {
        it("[case] - bootstraps distinct organization and project realms with project-specific privileges", async () => {
            // Arrange
            await helpers.seedSystemPermissions(suite);
            const owner = randomUUID();
            const organizationRequest = {
                actor: owner,
                realm: randomUUID(),
                input: { process: randomUUID(), resource: randomUUID(), owner, name: "Organization" },
            };
            const organization = await suite.transaction((transaction) =>
                suite.repository().realmService.bootstrapOrganization({ ...organizationRequest, transaction }),
            );

            // Act
            const project = await suite.transaction((transaction) =>
                suite.repository().realmService.bootstrapProject({
                    actor: owner,
                    realm: randomUUID(),
                    input: {
                        process: randomUUID(),
                        resource: randomUUID(),
                        organizationRealm: organization.realm.id,
                        owner,
                        name: "Project",
                    },
                    transaction,
                }),
            );
            const permissions = (await loadPermissionAssignments(suite, project.realm.id)).map(
                ({ permission }) => permission.code,
            );
            const result = permissions.some((code) =>
                /^(team|department|dept_account_assignment|team_account_assignment)\./.test(code),
            );
            const organizationPermissions = (await loadPermissionAssignments(suite, organization.realm.id)).map(
                ({ permission }) => permission.code,
            );

            // Assert
            expect(organization.realm.type).toBe(RealmType.ORGANIZATION);
            expect(project.realm.type).toBe(RealmType.PROJECT);
            expect(project.roles).toHaveLength(3);
            expect(project.roles.find(({ code }) => code.endsWith(".root"))?.isSystemManaged).toBe(true);
            expect(permissions).toContain(PermissionCode.PROJECT_UPDATE);
            expect(permissions).not.toContain(PermissionCode.PROJECT_CREATE);
            expect(result).toBe(false);
            expect(organizationPermissions).toContain(PermissionCode.PROJECT_CREATE);
            expect(organizationPermissions).toContain(PermissionCode.DEPARTMENT_CREATE);
            expect(organizationPermissions).toContain(PermissionCode.TEAM_CREATE);
        });
    });

    describe("[Method] - bootstrapOrganization", () => {
        it("[case] - rejects bootstrap of an existing realm without replacing its owner", async () => {
            // Arrange
            const existing = await suite.fixtures().createRealm();

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().realmService.bootstrapOrganization({
                    actor: randomUUID(),
                    realm: existing.id,
                    input: { process: randomUUID(), resource: randomUUID(), owner: randomUUID(), name: "Duplicate" },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await suite.transaction((transaction) =>
                transaction.count(Realm, { id: existing.id, owner: existing.owner }),
            );

            // Assert
            await expect(result).rejects.toThrow("services.realm.ALREADY_EXISTS");
            expect(result2).toBe(1);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - purges a revoked realm through database cascades without touching another realm", async () => {
            // Arrange
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "purge-target", isRevoked: true });
            const foreignRealm = await suite.fixtures().createRealm({ code: "purge-foreign", isRevoked: true });
            const role = await suite.fixtures().createRole({ realm, code: "roles.target" });
            const foreignRole = await suite.fixtures().createRole({ realm: foreignRealm, code: "roles.foreign" });
            const permission = await suite.fixtures().createPermission({ realm, code: "permissions.target" });
            await suite.fixtures().createAccountRoleAssignment({ realm, role, account });
            await suite.fixtures().createRolePermissionAssignment({ realm, role, permission });

            // Act
            const result = await countRealmGraphRows(suite, realm);

            const result2 = await countRealmGraphRows(suite, foreignRealm);

            await suite.transaction((transaction) =>
                suite.repository().realmService.purge({
                    identifiers: [realm.id],
                    actor: realm.owner,
                    global: false,
                    transaction,
                }),
            );
            const result3 = await countRealmGraphRows(suite, realm);

            const result4 = await loadRealm(suite, foreignRealm.id);

            const result5 = await loadRoles(suite, foreignRealm.id);

            // Assert
            expect(result).toBeGreaterThan(0);
            expect(result2).toBeGreaterThan(0);
            expect(result3).toBe(0);
            expect(result4).toEqual(expect.objectContaining({ id: foreignRealm.id }));
            expect(result5).toEqual([expect.objectContaining({ id: foreignRole.id })]);
        });
    });

    describe("[Behavior] - account access lifecycle", () => {
        it("[case] - restores system revocations but preserves manual revocations", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();
            const role = await suite.fixtures().createRole({ realm });
            const secondRole = await suite.fixtures().createRole({ realm });
            const permission = await suite.fixtures().createPermission({ realm });
            const account = randomUUID();
            const assignment = await suite.fixtures().createAccountRoleAssignment({ realm, role, account });
            const manual = await suite
                .fixtures()
                .createAccountRoleAssignment({ realm, role: secondRole, account, isRevoked: true });
            const override = await suite
                .fixtures()
                .createPermissionOverride({ realm, permission, account, effect: PermissionOverrideEffect.ALLOW });
            await suite.transaction((transaction) =>
                suite.repository().realmService.revokeAccountAccess({ realm: realm.id, account, transaction }),
            );

            // Act
            await suite.transaction((transaction) =>
                suite.repository().realmService.restoreAccountAccess({ realm: realm.id, account, transaction }),
            );
            const [restored, untouched, restoredOverride] = await suite.transaction((transaction) =>
                Promise.all([
                    transaction.findOneOrFail(AccountRoleAssignment, assignment.id),
                    transaction.findOneOrFail(AccountRoleAssignment, manual.id),
                    transaction.findOneOrFail(PermissionOverride, override.id),
                ]),
            );

            // Assert
            expect(restored.isRevoked).toBe(false);
            expect(restored.isSystemRevoked).toBe(false);
            expect(untouched.isRevoked).toBe(true);
            expect(untouched.isSystemRevoked).toBe(false);
            expect(restoredOverride.isRevoked).toBe(false);
        });
    });

    describe("[Method] - purgeAccountAccess", () => {
        it("[case] - purges active assignments and overrides without soft-purge preconditions", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();
            const role = await suite.fixtures().createRole({ realm });
            const permission = await suite.fixtures().createPermission({ realm });
            const account = randomUUID();
            const other = randomUUID();
            await suite.fixtures().createAccountRoleAssignment({ realm, role, account });
            await suite
                .fixtures()
                .createPermissionOverride({ realm, permission, account, effect: PermissionOverrideEffect.ALLOW });
            await suite.fixtures().createAccountRoleAssignment({ realm, role, account: other });

            // Act
            const result = await suite.transaction((transaction) =>
                suite.repository().realmService.purgeAccountAccess({ realm: realm.id, account, transaction }),
            );
            const result2 = await suite.transaction((transaction) =>
                transaction.count(AccountRoleAssignment, { account, realm: realm.id }),
            );
            const result3 = await suite.transaction((transaction) =>
                transaction.count(PermissionOverride, { account, realm: realm.id }),
            );
            const result4 = await suite.transaction((transaction) =>
                transaction.count(AccountRoleAssignment, { account: other, realm: realm.id }),
            );

            // Assert
            expect(result.assignments).toHaveLength(1);
            expect(result.overrides).toHaveLength(1);
            expect(result2).toBe(0);
            expect(result3).toBe(0);
            expect(result4).toBe(1);
        });
    });

    describe("[Method] - transferOwnership", () => {
        it("[case] - moves only the administrator role and rejects a repeated transfer", async () => {
            // Arrange
            const previousOwner = randomUUID();
            const owner = randomUUID();
            const realm = await suite.fixtures().createRealm({ owner: previousOwner });
            const admin = await suite.fixtures().createRole({ realm, code: `${realm.code}.administrator` });
            const custom = await suite.fixtures().createRole({ realm });
            await suite.fixtures().createAccountRoleAssignment({ realm, account: previousOwner, role: admin });
            await suite.fixtures().createAccountRoleAssignment({ realm, account: previousOwner, role: custom });
            const existing = await suite
                .fixtures()
                .createAccountRoleAssignment({ realm, account: owner, role: admin, isRevoked: true });
            const request = {
                actor: previousOwner,
                realm: realm.id,
                input: { process: randomUUID(), organization: randomUUID(), owner, previousOwner },
            };

            // Act
            const result = await suite.transaction((transaction) =>
                suite.repository().realmService.transferOwnership({ ...request, transaction }),
            );
            const [loaded, oldAdmin, newAdmin, unrelated] = await suite.transaction((transaction) =>
                Promise.all([
                    transaction.findOneOrFail(Realm, realm.id),
                    transaction.count(AccountRoleAssignment, { realm: realm.id, account: previousOwner, role: admin.id }),
                    transaction.count(AccountRoleAssignment, {
                        realm: realm.id,
                        account: owner,
                        role: admin.id,
                        isRevoked: false,
                    }),
                    transaction.count(AccountRoleAssignment, { realm: realm.id, account: previousOwner, role: custom.id }),
                ]),
            );
            const result2 = suite.transaction((transaction) =>
                suite.repository().realmService.transferOwnership({ ...request, transaction }),
            );

            // Assert
            expect(result.assignments[0].id).toBe(existing.id);
            expect(result.previousAssignments).toHaveLength(1);
            expect(loaded.owner).toBe(owner);
            expect([oldAdmin, newAdmin, unrelated]).toEqual([0, 1, 1]);
            await expect(result2).rejects.toThrow("services.realm.OWNER_MISMATCH");
        });
    });

    describe("[Method] - restoreBySystem", () => {
        it("[case] - rejects an invalid system restore without changing the realm", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().realmService.restoreBySystem({ realm: realm.id, transaction }),
            );
            await Promise.allSettled([result]);
            const loaded = await loadRealm(suite, realm.id);

            // Assert
            await expect(result).rejects.toThrow("ALREADY_ACTIVE");
            expect(loaded.isRevoked).toBe(false);
            expect(loaded.version).toBe(realm.version);
        });
    });

    describe("[Behavior] - system revocation", () => {
        it("[case] - preserves manual revocation through system lifecycle operations", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ isRevoked: true });

            // Act
            const revoked = await suite.transaction((transaction) =>
                suite.repository().realmService.revokeBySystem({ realm: realm.id, transaction }),
            );
            const restored = await suite.transaction((transaction) =>
                suite.repository().realmService.restoreBySystem({ realm: realm.id, transaction }),
            );
            const loaded = await loadRealm(suite, realm.id);

            // Assert
            expect(revoked).toEqual([]);
            expect(restored).toEqual([]);
            expect(loaded.isRevoked).toBe(true);
            expect(loaded.isSystemRevoked).toBe(false);
        });
    });

    describe("[Behavior] - system lifecycle", () => {
        it("[case] - rejects system lifecycle changes after realm deletion", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();
            await suite.transaction((transaction) =>
                suite.repository().realmService.purgeBySystem({ realm: realm.id, transaction }),
            );

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().realmService.restoreBySystem({ realm: realm.id, transaction }),
            );
            await Promise.allSettled([result]);
            const result2 = await suite.transaction((transaction) => transaction.count(Realm, { id: realm.id }));

            // Assert
            await expect(result).rejects.toThrow();
            expect(result2).toBe(0);
        });
    });

    describe("[Behavior] - lifecycle ownership", () => {
        it.each(["revoke", "restore", "purge"] as const)(
            "[case] - rejects a mixed owned/foreign batch for %s without changing either target",
            async (method) => {
                // Arrange
                const actor = randomUUID();
                const owned = await suite.fixtures().createRealm({ owner: actor, isRevoked: method !== "revoke" });
                const foreign = await suite.fixtures().createRealm({ owner: randomUUID(), isRevoked: method !== "revoke" });

                // Act
                const result = suite.transaction((transaction) =>
                    suite.repository().realmService[method]({
                        identifiers: [owned.id, foreign.id],
                        global: false,
                        transaction,
                        actor,
                    }),
                );
                await Promise.allSettled([result]);
                const states = await suite.transaction((transaction) =>
                    Promise.all(
                        [owned.id, foreign.id].map(async (id) => (await transaction.findOneOrFail(Realm, id)).isRevoked),
                    ),
                );

                // Assert
                await expect(result).rejects.toThrow("services.realm.REALMS_NOT_FOUND");
                expect(states).toEqual([method !== "revoke", method !== "revoke"]);
            },
        );

        it.each(["revoke", "restore", "purge"] as const)(
            "[case] - permits global %s for another owner's target",
            async (method) => {
                // Arrange
                const actor = randomUUID();
                const target = await suite.fixtures().createRealm({ isRevoked: method !== "revoke" });
                await suite.transaction((transaction) =>
                    suite.repository().realmService[method]({
                        actor,
                        global: true,
                        identifiers: [target.id],
                        transaction,
                    }),
                );

                // Act
                const remaining = await suite.transaction((transaction) => transaction.findOne(Realm, target.id));

                // Assert
                if (method === "purge") {
                    expect(remaining).toBeNull();
                } else {
                    expect(remaining?.isRevoked).toBe(method === "revoke");
                }
            },
        );

        it("[case] - allows the owner to revoke, restore, revoke and purge without a target realm context", async () => {
            // Arrange
            const actor = randomUUID();
            const target = await suite.fixtures().createRealm({ owner: actor });
            for await (const method of ["revoke", "restore", "revoke", "purge"] as const) {
                await suite.transaction((transaction) =>
                    suite.repository().realmService[method]({
                        identifiers: [target.id],
                        global: false,
                        transaction,
                        actor,
                    }),
                );
            }

            // Act
            const result = await suite.transaction((transaction) => transaction.count(Realm, { id: target.id }));

            // Assert
            expect(result).toBe(0);
        });
    });
});
