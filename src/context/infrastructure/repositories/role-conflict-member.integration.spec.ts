import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { RoleConflictMemberRepository } from "~context/infrastructure/repositories/role-conflict-member.repository";
import { RoleConflictMemberFixture } from "~testing/integration/repositories/role-conflict-member.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        MAX_CONFLICT_MEMBERS_COUNT: 3,
    });
}

describe("[Repository] - RoleConflictMember", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RoleConflictMemberRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RoleConflictMemberFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted conflict member through the schema", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();
            const group = await suite.fixtures().createRoleConflictGroup({ realm });
            const role = await suite.fixtures().createDetachedRole({ realm });
            const member = await suite.fixtures().createRoleConflictMember({
                isSystemManaged: true,
                isRevoked: true,
                group,
                role,
            });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: member.id } });

            // Assert
            expect(loaded).toMatchObject({
                createdAt: member.createdAt,
                version: member.version,
                isSystemManaged: true,
                isRevoked: true,
                id: member.id,
            });
            expect(loaded.group.id).toBe(group.id);
            expect(loaded.role.id).toBe(role.id);
        });
    });

    describe("[Method] - wouldExceedMemberLimit", () => {
        it("[case] - checks conflict member count limit per group", async () => {
            // Arrange
            const scenario = await suite.fixtures().limitScenario();

            // Act
            const result = await suite.repository().wouldExceedMemberLimit({ group: scenario.group.id, count: 1 });

            const result2 = await suite.repository().wouldExceedMemberLimit({ group: scenario.group.id, count: 2 });

            // Assert
            expect(result).toBe(scenario.expectedCountOneResult);
            expect(result2).toBe(scenario.expectedCountTwoResult);
        });
    });
});
