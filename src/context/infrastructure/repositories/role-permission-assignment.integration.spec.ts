import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { RolePermissionAssignmentRepository } from "~context/infrastructure/repositories/role-permission-assignment.repository";
import { RolePermissionAssignmentFixture } from "~testing/fixtures/role-permission-assignment.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        PERMISSION_PER_ROLE_LIMIT: 3,
    });
}

describe("RolePermissionAssignmentRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RolePermissionAssignmentRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RolePermissionAssignmentFixture(entityManager),
    });

    it("maps the persisted grant through the schema", async () => {
        const realm = await suite.fixtures().createRealm();
        const role = await suite.fixtures().createDetachedRole({ realm });
        const permission = await suite.fixtures().createPermission({ realm });
        const grant = await suite.fixtures().createRolePermissionAssignment({
            isSystemManaged: true,
            isRevoked: true,
            permission,
            realm,
            role,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: grant.id } });

        expect(loaded).toMatchObject({
            createdAt: grant.createdAt,
            version: grant.version,
            isSystemManaged: true,
            scope: grant.scope,
            isRevoked: true,
            id: grant.id,
        });
        expect(loaded.permission.id).toBe(permission.id);
        expect(loaded.realm.id).toBe(realm.id);
        expect(loaded.role.id).toBe(role.id);
    });

    it("checks role permission limit using active assignments and overlaps", async () => {
        const scenario = await suite.fixtures().limitScenario();

        await expect(
            suite.repository().wouldExceedPermissionLimit({
                permissions: [scenario.permissions.overlapping.id, scenario.permissions.revoked.id],
                role: scenario.role.id,
            }),
        ).resolves.toBe(scenario.expectedOverlappingResult);
        await expect(
            suite.repository().wouldExceedPermissionLimit({
                permissions: [scenario.permissions.revoked.id, scenario.permissions.additional.id],
                role: scenario.role.id,
            }),
        ).resolves.toBe(scenario.expectedAdditionalResult);
    });
});
