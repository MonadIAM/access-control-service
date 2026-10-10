import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { RoleDelegationPolicyRepository } from "~context/infrastructure/repositories/role-delegation-policy.repository";
import { RoleDelegationPolicyFixture } from "~testing/integration/repositories/role-delegation-policy.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        DELEGATION_POLICY_PER_ROLE_LIMIT: 3,
    });
}

describe("[Repository] - RoleDelegationPolicy", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RoleDelegationPolicyRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RoleDelegationPolicyFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted delegation policy through the schema", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();
            const delegator = await suite.fixtures().createDetachedRole({ realm, code: "mapping.delegator" });
            const target = await suite.fixtures().createDetachedRole({ realm, code: "mapping.target" });
            const policy = await suite.fixtures().createRoleDelegationPolicy({
                justification: "Mapping policy justification",
                expiresAt: new Date("2027-01-01T00:00:00.000Z"),
                isSystemManaged: true,
                isRevoked: true,
                depthLimit: 2,
                delegator,
                target,
                realm,
            });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: policy.id } });

            // Assert
            expect(loaded).toMatchObject({
                justification: "Mapping policy justification",
                expiresAt: policy.expiresAt,
                createdAt: policy.createdAt,
                version: policy.version,
                isSystemManaged: true,
                isRevoked: true,
                depthLimit: 2,
                id: policy.id,
            });
            expect(loaded.delegator.id).toBe(delegator.id);
            expect(loaded.target.id).toBe(target.id);
            expect(loaded.realm.id).toBe(realm.id);
        });
    });

    describe("[Method] - existsTransitivePath", () => {
        it("[case] - resolves transitive delegation paths and ignores expired policies", async () => {
            // Arrange
            const scenario = await suite.fixtures().transitiveScenario();

            // Act
            const result = await suite.repository().existsTransitivePath({
                from: scenario.from.id,
                to: scenario.reachableRole.id,
            });
            const result2 = await suite.repository().existsTransitivePath({
                from: scenario.from.id,
                to: scenario.blockedRole.id,
            });
            const result3 = await suite.repository().existsTransitivePath({
                from: scenario.from.id,
                to: scenario.realmBlockedRole.id,
            });

            // Assert
            expect(result).toBe(true);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
        });
    });

    describe("[Method] - isDelegationAllowed", () => {
        it("[case] - checks actor delegation permissions through active account roles", async () => {
            // Arrange
            const scenario = await suite.fixtures().allowedScenario();

            // Act
            const result = await suite.repository().isDelegationAllowed({
                roles: scenario.allowedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            });
            const result2 = await suite.repository().isDelegationAllowed({
                roles: scenario.deniedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            });
            const result3 = await suite.repository().isDelegationAllowed({
                roles: scenario.foreignDeniedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            });

            // Assert
            expect(result).toBe(true);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
        });

        it("[case] - does not allow delegation through expired actor role assignments", async () => {
            // Arrange
            const scenario = await suite.fixtures().expiredActorScenario();

            // Act
            const result = await suite.repository().isDelegationAllowed({
                roles: scenario.deniedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            });

            // Assert
            expect(result).toBe(false);
        });

        it("[case] - requires every requested role to be allowed despite duplicate policy matches", async () => {
            // Arrange
            const scenario = await suite.fixtures().duplicateTargetsScenario();

            // Act
            const result = await suite.repository().isDelegationAllowed({
                roles: scenario.requestedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            });

            // Assert
            expect(result).toBe(scenario.expectedResult);
        });
    });

    describe("[Method] - wouldExceedPolicyLimit", () => {
        it("[case] - checks active delegation policy count limit per delegator", async () => {
            // Arrange
            const scenario = await suite.fixtures().limitScenario();

            // Act
            const result = await suite.repository().wouldExceedPolicyLimit({ delegator: scenario.delegator.id });

            const result2 = await suite.repository().wouldExceedPolicyLimit({ delegator: scenario.delegator.id, count: 2 });

            // Assert
            expect(result).toBe(scenario.expectedCountOneResult);
            expect(result2).toBe(scenario.expectedCountTwoResult);
        });
    });
});
