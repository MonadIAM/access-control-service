import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { ADMIN_PERMISSION_CODES, USER_PERMISSION_CODES } from "~infrastructure/datasets/bootstrap";
import { RealmIntegrationHelpers } from "~testing/integration/domain-service/realm.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { RoleArchetype } from "~context/enums";
import {
    RolePermissionAssignment,
    AccountRoleAssignment,
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

describe("RealmService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates a persisted realm bootstrap with base roles and assignments", async () => {
        await helpers.seedSystemPermissions(suite);

        const actor = randomUUID();
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

        const adminAssignments = permissionAssignments.filter(({ role }) => role.code === "customer.administrator");
        const userAssignments = permissionAssignments.filter(({ role }) => role.code === "customer.user");

        expect(adminAssignments.map(({ permission }) => permission.code).sort()).toEqual(
            [...ADMIN_PERMISSION_CODES].sort(),
        );
        expect(userAssignments.map(({ permission }) => permission.code).sort()).toEqual([...USER_PERMISSION_CODES].sort());
    });

    it("rolls back a partial bootstrap when a system permission is missing", async () => {
        const systemRealm = await helpers.seedSystemPermissions(suite);
        const [missingCode] = ADMIN_PERMISSION_CODES;

        await suite.transaction(async (transaction) => {
            const permission = await transaction.findOneOrFail(Permission, {
                code: missingCode,
                realm: systemRealm.id,
            });

            transaction.remove(permission);
        });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().realmService.create({
                    input: {
                        code: "missing-permissions",
                        name: "Missing Permissions",
                    },
                    actor: randomUUID(),
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.realm.MISSING_SYSTEM_PERMISSIONS");

        await expect(countBootstrapRowsByCode(suite, "missing-permissions")).resolves.toBe(0);
    });

    it("does not create a realm when the owner reaches the real realm limit", async () => {
        await helpers.seedSystemPermissions(suite);

        const actor = randomUUID();
        await suite.fixtures().createRealm({ owner: actor, code: "limit.first" });
        await suite.fixtures().createRealm({ owner: actor, code: "limit.second" });
        await suite.fixtures().createRealm({ owner: actor, code: "limit.third" });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().realmService.create({
                    input: {
                        code: "limit.fourth",
                        name: "Fourth Realm",
                    },
                    transaction,
                    actor,
                }),
            ),
        ).rejects.toThrow("services.realm.LIMIT_EXCEEDED");

        await expect(countBootstrapRowsByCode(suite, "limit.fourth")).resolves.toBe(0);
    });

    it("uses only system permissions when another realm has the same permission code", async () => {
        const systemRealm = await helpers.seedSystemPermissions(suite);
        const foreignRealm = await suite.fixtures().createRealm({
            code: "foreign",
            name: "Foreign",
        });

        await suite.fixtures().createPermission({
            code: ADMIN_PERMISSION_CODES[0],
            name: "Foreign Duplicate Permission",
            realm: foreignRealm,
        });

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

        expect(assignments).toHaveLength(ADMIN_PERMISSION_CODES.length + USER_PERMISSION_CODES.length);
        expect(assignedRealmIds.every((realm) => realm === systemRealm.id)).toBe(true);
    });

    it("purges a revoked realm through database cascades without touching another realm", async () => {
        const account = randomUUID();
        const realm = await suite.fixtures().createRealm({ code: "purge-target", isRevoked: true });
        const foreignRealm = await suite.fixtures().createRealm({ code: "purge-foreign", isRevoked: true });
        const role = await suite.fixtures().createRole({ realm, code: "roles.target" });
        const foreignRole = await suite.fixtures().createRole({ realm: foreignRealm, code: "roles.foreign" });
        const permission = await suite.fixtures().createPermission({ realm, code: "permissions.target" });

        await suite.fixtures().createAccountRoleAssignment({ realm, role, account });
        await suite.fixtures().createRolePermissionAssignment({ realm, role, permission });

        await expect(countRealmGraphRows(suite, realm)).resolves.toBeGreaterThan(0);
        await expect(countRealmGraphRows(suite, foreignRealm)).resolves.toBeGreaterThan(0);

        await suite.transaction((transaction) =>
            suite.repository().realmService.purge({
                identifiers: [realm.id],
                transaction,
            }),
        );

        await expect(countRealmGraphRows(suite, realm)).resolves.toBe(0);
        await expect(loadRealm(suite, foreignRealm.id)).resolves.toEqual(expect.objectContaining({ id: foreignRealm.id }));
        await expect(loadRoles(suite, foreignRealm.id)).resolves.toEqual([expect.objectContaining({ id: foreignRole.id })]);
    });
});
