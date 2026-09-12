import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { RoleConflictMemberRepository } from "~context/infrastructure/repositories/role-conflict-member.repository";
import { RoleConflictMemberFixture } from "~testing/integration/repositories/role-conflict-member.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        MAX_CONFLICT_MEMBERS_COUNT: 3,
    });
}

describe("RoleConflictMemberRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RoleConflictMemberRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RoleConflictMemberFixture(entityManager),
    });

    it("maps the persisted conflict member through the schema", async () => {
        const realm = await suite.fixtures().createRealm();
        const group = await suite.fixtures().createRoleConflictGroup({ realm });
        const role = await suite.fixtures().createDetachedRole({ realm });
        const member = await suite.fixtures().createRoleConflictMember({
            isSystemManaged: true,
            isRevoked: true,
            group,
            role,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: member.id } });

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

    it("checks conflict member count limit per group", async () => {
        const scenario = await suite.fixtures().limitScenario();

        await expect(suite.repository().wouldExceedMemberLimit({ group: scenario.group.id, count: 1 })).resolves.toBe(
            scenario.expectedCountOneResult,
        );
        await expect(suite.repository().wouldExceedMemberLimit({ group: scenario.group.id, count: 2 })).resolves.toBe(
            scenario.expectedCountTwoResult,
        );
    });
});
