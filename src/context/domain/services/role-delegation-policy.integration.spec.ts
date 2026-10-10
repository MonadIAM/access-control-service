import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { RoleDelegationPolicyIntegrationHelpers } from "~testing/integration/domain-service/role-delegation-policy.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { RoleDelegationPolicy } from "~context/domain/entities";
import { DelegatorType } from "~context/enums";

const helpers = new RoleDelegationPolicyIntegrationHelpers();

async function countPolicies(suite: Integration.Domain.RoleDelegationPolicy.Suite, realm: Entities.Realm): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(RoleDelegationPolicy, { realm: realm.id }));
}

async function loadPolicy(
    suite: Integration.Domain.RoleDelegationPolicy.Suite,
    id: string,
): Promise<Entities.RoleDelegationPolicy> {
    return await suite.transaction((transaction) => transaction.findOneOrFail(RoleDelegationPolicy, { id }));
}

async function loadDelegableRoleCodes(
    suite: Integration.Domain.RoleDelegationPolicy.Suite,
    actor: string,
    realm: Entities.Realm,
): Promise<string[]> {
    const [roles] = await suite.repository().repositories.roles.findDelegable({
        pagination: { currentPage: 1, elementsPerPage: 10 },
        where: { type: DelegatorType.ACCOUNT, id: actor, realm: realm.id },
        filters: {},
        sort: {},
    });

    return roles.map(({ code }) => code).sort();
}

describe("[DomainService] - RoleDelegationPolicy", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates a policy that makes target descendants delegable", async () => {
            // Arrange
            const actor = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "delegation-create" });
            const delegator = await suite.fixtures().createRole({ realm, code: "roles.delegator" });
            const target = await suite.fixtures().createRole({ realm, code: "roles.target" });
            const child = await suite.fixtures().createRole({ realm, code: "roles.child" });
            await suite.fixtures().createRoleClosure({ realm, ancestor: target, descendant: child, depth: 1 });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: delegator, account: actor });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().roleDelegationPolicyService.create({
                    input: {
                        justification: "delegate subtree",
                        delegator: delegator.id,
                        depthLimit: 1,
                        target: target.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );

            const result = await loadDelegableRoleCodes(suite, actor, realm);

            // Assert
            expect(result).toEqual(["roles.child", "roles.target"]);
        });

        it("[case] - rolls back policy creation when it would create a delegation cycle", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "delegation-cycle" });
            const first = await suite.fixtures().createRole({ realm, code: "roles.first" });
            const second = await suite.fixtures().createRole({ realm, code: "roles.second" });
            await suite.fixtures().createRoleDelegationPolicy({ realm, delegator: second, target: first });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().roleDelegationPolicyService.create({
                    input: {
                        justification: "cycle",
                        delegator: first.id,
                        target: second.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countPolicies(suite, realm);

            // Assert
            await expect(result).rejects.toThrow("services.role-delegation-policy.EXISTS_TRANSITIVE_PATH");
            expect(result2).toBe(1);
        });

        it("[case] - rolls back duplicate policy creation through the real unique constraint", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "delegation-duplicate" });
            const delegator = await suite.fixtures().createRole({ realm, code: "roles.delegator" });
            const target = await suite.fixtures().createRole({ realm, code: "roles.target" });
            await suite.fixtures().createRoleDelegationPolicy({ realm, delegator, target });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().roleDelegationPolicyService.create({
                    input: {
                        justification: "duplicate",
                        delegator: delegator.id,
                        target: target.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countPolicies(suite, realm);

            // Assert
            await expect(result).rejects.toThrow("role_delegation_policy_realm_delegator_target_unique");
            expect(result2).toBe(1);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - purges only revoked policies and leaves active policies intact", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "delegation-purge" });
            const delegator = await suite.fixtures().createRole({ realm, code: "roles.delegator" });
            const target = await suite.fixtures().createRole({ realm, code: "roles.target" });
            const activeTarget = await suite.fixtures().createRole({ realm, code: "roles.active-target" });
            const revoked = await suite
                .fixtures()
                .createRoleDelegationPolicy({ realm, delegator, target, isRevoked: true });
            const active = await suite.fixtures().createRoleDelegationPolicy({
                target: activeTarget,
                delegator,
                realm,
            });
            await suite.transaction((transaction) =>
                suite.repository().roleDelegationPolicyService.purge({
                    identifiers: [revoked.id],
                    realm: realm.id,
                    transaction,
                }),
            );

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().roleDelegationPolicyService.purge({
                    identifiers: [active.id],
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countPolicies(suite, realm);

            // Assert
            await expect(result).rejects.toThrow("entities.role-delegation-policy.CANNOT_PURGE_ACTIVE");
            expect(result2).toBe(1);
        });
    });

    describe("[Method] - expire", () => {
        it("[case] - expires only provided policies through persisted merge and revoke", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "delegation-expire" });
            const delegator = await suite.fixtures().createRole({ realm, code: "roles.delegator" });
            const expiredTarget = await suite.fixtures().createRole({ realm, code: "roles.expired-target" });
            const activeTarget = await suite.fixtures().createRole({ realm, code: "roles.active-target" });
            const expired = await suite.fixtures().createRoleDelegationPolicy({
                expiresAt: new Date("2026-01-01T00:00:00.000Z"),
                target: expiredTarget,
                delegator,
                realm,
            });
            const active = await suite.fixtures().createRoleDelegationPolicy({
                expiresAt: new Date("2999-01-01T00:00:00.000Z"),
                target: activeTarget,
                delegator,
                realm,
            });

            // Act
            await suite.transaction((transaction) =>
                Promise.resolve(
                    suite.repository().roleDelegationPolicyService.expire({
                        entities: [expired],
                        transaction,
                    }),
                ),
            );

            const result = await loadPolicy(suite, expired.id);

            const result2 = await loadPolicy(suite, active.id);

            // Assert
            expect(result).toEqual(expect.objectContaining({ isRevoked: true }));
            expect(result2).toEqual(expect.objectContaining({ isRevoked: false }));
        });
    });
});
