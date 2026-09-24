import { describe, expect, it } from "@jest/globals";

import { RolePermissionAssignmentIntegrationHelpers } from "~testing/integration/domain-service/role-permission-assignment.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { RolePermissionAssignment } from "~context/domain/entities";

const helpers = new RolePermissionAssignmentIntegrationHelpers();

async function loadAssignments(
    suite: Integration.Domain.RolePermissionAssignment.Suite,
    realm: Entities.Realm,
): Promise<Entities.RolePermissionAssignment[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            RolePermissionAssignment,
            { realm: realm.id },
            { populate: ["permission", "role"], orderBy: { permission: { code: "asc" } } },
        ),
    );
}

async function countAssignments(
    suite: Integration.Domain.RolePermissionAssignment.Suite,
    realm: Entities.Realm,
): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(RolePermissionAssignment, { realm: realm.id }));
}

describe("RolePermissionAssignmentService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates assignments for custom and system-realm permissions", async () => {
        const systemRealm = await helpers.seedSystemRealm(suite);
        const realm = await suite.fixtures().createRealm({ code: "role-permission-create" });
        const role = await suite.fixtures().createRole({ code: "roles.editor", name: "Editor", realm });
        const customPermission = await suite.fixtures().createPermission({ realm, code: "documents.write" });
        const systemPermission = await suite.fixtures().createPermission({
            code: "system.audit.read",
            realm: systemRealm,
        });

        const result = await suite.transaction((transaction) =>
            suite.repository().rolePermissionAssignmentService.create({
                input: {
                    permissions: [customPermission.id, systemPermission.id],
                    role: role.id,
                },
                realm: realm.id,
                transaction,
            }),
        );

        const assignments = await loadAssignments(suite, realm);

        expect(result).toHaveLength(2);
        expect(assignments.map(({ permission }) => permission.code)).toEqual(["documents.write", "system.audit.read"]);
        expect(assignments.every(({ role: assignedRole }) => assignedRole.id === role.id)).toBe(true);
    });

    it("rolls back assignment creation for a foreign non-system permission", async () => {
        const realm = await suite.fixtures().createRealm({ code: "role-permission-foreign" });
        const foreignRealm = await suite.fixtures().createRealm({ code: "role-permission-foreign-source" });
        const role = await suite.fixtures().createRole({ code: "roles.editor", name: "Editor", realm });
        const foreignPermission = await suite.fixtures().createPermission({
            code: "foreign.permission",
            realm: foreignRealm,
        });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().rolePermissionAssignmentService.create({
                    input: {
                        permissions: [foreignPermission.id],
                        role: role.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.role-permission-assignment.PERMISSIONS_NOT_FOUND");

        await expect(countAssignments(suite, realm)).resolves.toBe(0);
    });

    it("rolls back assignment creation when the role permission limit is exceeded", async () => {
        const realm = await suite.fixtures().createRealm({ code: "role-permission-limit" });
        const role = await suite.fixtures().createRole({ code: "roles.editor", name: "Editor", realm });
        const first = await suite.fixtures().createPermission({ realm, code: "permissions.first" });
        const second = await suite.fixtures().createPermission({ realm, code: "permissions.second" });
        const third = await suite.fixtures().createPermission({ realm, code: "permissions.third" });
        const fourth = await suite.fixtures().createPermission({ realm, code: "permissions.fourth" });

        await suite.fixtures().createRolePermissionAssignment({ realm, role, permission: first });
        await suite.fixtures().createRolePermissionAssignment({ realm, role, permission: second });
        await suite.fixtures().createRolePermissionAssignment({ realm, role, permission: third });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().rolePermissionAssignmentService.create({
                    input: {
                        permissions: [fourth.id],
                        role: role.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.role-permission-assignment.ROLE_PERMISSION_LIMIT_EXCEEDED");

        await expect(countAssignments(suite, realm)).resolves.toBe(3);
    });
});
