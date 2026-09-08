import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { RoleDelegationPolicyRepository } from "~context/infrastructure/repositories/role-delegation-policy.repository";
import { RoleDelegationPolicyFixture } from "~testing/fixtures/role-delegation-policy.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        DELEGATION_POLICY_PER_ROLE_LIMIT: 3,
    });
}

describe("RoleDelegationPolicyRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RoleDelegationPolicyRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RoleDelegationPolicyFixture(entityManager),
    });

    it("maps the persisted delegation policy through the schema", async () => {
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

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: policy.id } });

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

    it("resolves transitive delegation paths and ignores expired policies", async () => {
        const scenario = await suite.fixtures().transitiveScenario();

        await expect(
            suite.repository().existsTransitivePath({
                from: scenario.from.id,
                to: scenario.reachableRole.id,
            }),
        ).resolves.toBe(true);
        await expect(
            suite.repository().existsTransitivePath({
                from: scenario.from.id,
                to: scenario.blockedRole.id,
            }),
        ).resolves.toBe(false);
        await expect(
            suite.repository().existsTransitivePath({
                from: scenario.from.id,
                to: scenario.realmBlockedRole.id,
            }),
        ).resolves.toBe(false);
    });

    it("checks actor delegation permissions through active account roles", async () => {
        const scenario = await suite.fixtures().allowedScenario();

        await expect(
            suite.repository().isDelegationAllowed({
                roles: scenario.allowedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            }),
        ).resolves.toBe(true);
        await expect(
            suite.repository().isDelegationAllowed({
                roles: scenario.deniedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            }),
        ).resolves.toBe(false);
        await expect(
            suite.repository().isDelegationAllowed({
                roles: scenario.foreignDeniedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            }),
        ).resolves.toBe(false);
    });

    it("does not allow delegation through expired actor role assignments", async () => {
        const scenario = await suite.fixtures().expiredActorScenario();

        await expect(
            suite.repository().isDelegationAllowed({
                roles: scenario.deniedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            }),
        ).resolves.toBe(false);
    });

    it("requires every requested role to be allowed despite duplicate policy matches", async () => {
        const scenario = await suite.fixtures().duplicateTargetsScenario();

        await expect(
            suite.repository().isDelegationAllowed({
                roles: scenario.requestedRoles.map(({ id }) => id),
                realm: scenario.realm.id,
                actor: scenario.actor,
            }),
        ).resolves.toBe(scenario.expectedResult);
    });

    it("checks active delegation policy count limit per delegator", async () => {
        const scenario = await suite.fixtures().limitScenario();

        await expect(suite.repository().wouldExceedPolicyLimit({ delegator: scenario.delegator.id })).resolves.toBe(
            scenario.expectedCountOneResult,
        );
        await expect(
            suite.repository().wouldExceedPolicyLimit({ delegator: scenario.delegator.id, count: 2 }),
        ).resolves.toBe(scenario.expectedCountTwoResult);
    });
});
