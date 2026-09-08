import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { AccountRoleAssignmentRepository } from "~context/infrastructure/repositories/account-role-assignment.repository";
import { AccountRoleAssignmentFixture } from "~testing/fixtures/account-role-assignment.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        ROLE_PER_ACCOUNT_LIMIT: 3,
    });
}

describe("AccountRoleAssignmentRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new AccountRoleAssignmentRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new AccountRoleAssignmentFixture(entityManager),
    });

    it("maps the persisted assignment through the schema", async () => {
        const realm = await suite.fixtures().createRealm();
        const role = await suite.fixtures().createDetachedRole({ realm });
        const assignment = await suite.fixtures().createAccountRoleAssignment({
            justification: "Mapping assignment justification",
            expiresAt: new Date("2027-01-01T00:00:00.000Z"),
            account: "6f1c9d64-9f4c-4d4a-9d0c-9a5f0a6a1b21",
            isSystemManaged: true,
            isRevoked: true,
            realm,
            role,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: assignment.id } });

        expect(loaded).toMatchObject({
            justification: "Mapping assignment justification",
            account: "6f1c9d64-9f4c-4d4a-9d0c-9a5f0a6a1b21",
            createdAt: assignment.createdAt,
            expiresAt: assignment.expiresAt,
            version: assignment.version,
            isSystemManaged: true,
            id: assignment.id,
            isRevoked: true,
        });
        expect(loaded.realm.id).toBe(realm.id);
        expect(loaded.role.id).toBe(role.id);
    });

    it("checks account role limit using active assignments and overlaps", async () => {
        const scenario = await suite.fixtures().limitScenario();

        await expect(
            suite.repository().wouldExceedRoleLimit({
                roles: [scenario.roles.overlapping.id, scenario.roles.revoked.id],
                account: scenario.account,
            }),
        ).resolves.toBe(scenario.expectedOverlappingResult);
        await expect(
            suite.repository().wouldExceedRoleLimit({
                roles: [scenario.roles.revoked.id, scenario.roles.additional.id],
                account: scenario.account,
            }),
        ).resolves.toBe(scenario.expectedAdditionalResult);
    });
});
