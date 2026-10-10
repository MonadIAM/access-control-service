import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { AccountRoleAssignmentIntegrationHelpers } from "~testing/integration/domain-service/account-role-assignment.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { AccountRoleAssignment } from "~context/domain/entities";
import { RoleArchetype } from "~context/enums";

const helpers = new AccountRoleAssignmentIntegrationHelpers();

async function loadAssignments(
    suite: Integration.Domain.AccountRoleAssignment.Suite,
    account: string,
    realm: Entities.Realm,
): Promise<Entities.AccountRoleAssignment[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            AccountRoleAssignment,
            { account, realm: realm.id },
            { populate: ["role"], orderBy: { role: { code: "asc" } } },
        ),
    );
}

async function loadEffectiveRoleCodes(
    suite: Integration.Domain.AccountRoleAssignment.Suite,
    account: string,
    realm: Entities.Realm,
): Promise<string[]> {
    const [roles] = await suite.repository().repositories.roles.findEffective({
        pagination: { currentPage: 1, elementsPerPage: 10 },
        where: { account, realm: realm.id },
        filters: {},
        sort: {},
    });

    return roles.map(({ code }) => code).sort();
}

async function loadAssignment(
    suite: Integration.Domain.AccountRoleAssignment.Suite,
    id: string,
): Promise<Entities.AccountRoleAssignment> {
    return await suite.transaction((transaction) => transaction.findOneOrFail(AccountRoleAssignment, { id }));
}

async function createHierarchy(
    suite: Integration.Domain.AccountRoleAssignment.Suite,
    realm: Entities.Realm,
    ancestor: Entities.Role,
    descendant: Entities.Role,
    depth: number,
): Promise<void> {
    await suite.fixtures().createRoleClosure({ realm, ancestor, descendant, depth });
}

async function countRoleAssignments(
    suite: Integration.Domain.AccountRoleAssignment.Suite,
    account: string,
    realm: Entities.Realm,
): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(AccountRoleAssignment, { account, realm: realm.id }));
}

describe("[DomainService] - AccountRoleAssignment", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates assignments allowed by an active delegation policy", async () => {
            // Arrange
            const actor = randomUUID();
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "assignment-delegated" });
            const delegator = await suite.fixtures().createRole({ code: "roles.delegator", name: "Delegator", realm });
            const parent = await suite.fixtures().createRole({
                archetype: RoleArchetype.COMPOSITE,
                code: "roles.parent",
                name: "Parent",
                realm,
            });
            const child = await suite.fixtures().createRole({ code: "roles.child", name: "Child", realm });
            await createHierarchy(suite, realm, parent, child, 1);
            await suite.fixtures().createAccountRoleAssignment({ realm, role: delegator, account: actor });
            await suite.fixtures().createRoleDelegationPolicy({
                delegator,
                target: parent,
                depthLimit: 1,
                realm,
            });

            // Act
            const result = await suite.transaction((transaction) =>
                suite.repository().accountRoleAssignmentService.create({
                    input: {
                        roles: [child.id],
                        justification: "delegated",
                        account,
                    },
                    actor,
                    realm: realm.id,
                    transaction,
                }),
            );
            const assignments = await loadAssignments(suite, account, realm);
            const effectiveRoleCodes = await loadEffectiveRoleCodes(suite, account, realm);

            // Assert
            expect(result).toHaveLength(1);
            expect(assignments).toHaveLength(1);
            expect(assignments[0]).toMatchObject({
                justification: "delegated",
                role: { id: child.id },
                account,
            });
            expect(effectiveRoleCodes).toEqual(["roles.child", "roles.parent"]);
        });

        it("[case] - rolls back assignment creation when delegation is not allowed", async () => {
            // Arrange
            const actor = randomUUID();
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "assignment-delegation-denied" });
            const role = await suite.fixtures().createRole({ code: "roles.denied", name: "Denied", realm });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().accountRoleAssignmentService.create({
                    input: {
                        roles: [role.id],
                        account,
                    },
                    actor,
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countRoleAssignments(suite, account, realm);

            // Assert
            await expect(result).rejects.toThrow("services.account-role-assignment.DELEGATION_NOT_ALLOWED");
            expect(result2).toBe(0);
        });

        it("[case] - rolls back assignment creation when the account role limit is exceeded", async () => {
            // Arrange
            const actor = randomUUID();
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "assignment-limit" });
            const delegator = await suite.fixtures().createRole({ code: "roles.delegator", name: "Delegator", realm });
            const first = await suite.fixtures().createRole({ code: "roles.first", name: "First", realm });
            const second = await suite.fixtures().createRole({ code: "roles.second", name: "Second", realm });
            const third = await suite.fixtures().createRole({ code: "roles.third", name: "Third", realm });
            const candidate = await suite.fixtures().createRole({ code: "roles.candidate", name: "Candidate", realm });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: delegator, account: actor });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: first, account });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: second, account });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: third, account });
            await suite.fixtures().createRoleDelegationPolicy({
                delegator,
                target: candidate,
                realm,
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().accountRoleAssignmentService.create({
                    input: {
                        roles: [candidate.id],
                        account,
                    },
                    actor,
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countRoleAssignments(suite, account, realm);

            // Assert
            await expect(result).rejects.toThrow("services.account-role-assignment.ACCOUNT_ROLE_LIMIT_EXCEEDED");
            expect(result2).toBe(3);
        });

        it("[case] - rolls back assignment creation when the target roles violate SoD", async () => {
            // Arrange
            const actor = randomUUID();
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "assignment-sod" });
            const delegator = await suite.fixtures().createRole({ code: "roles.delegator", name: "Delegator", realm });
            const existing = await suite.fixtures().createRole({ code: "roles.existing", name: "Existing", realm });
            const candidate = await suite.fixtures().createRole({ code: "roles.candidate", name: "Candidate", realm });
            const group = await suite.fixtures().createRoleConflictGroup({
                code: "conflicts.exclusive",
                name: "Exclusive",
                maxAllowed: 1,
                realm,
            });
            await suite.fixtures().createRoleConflictMember({ group, role: existing });
            await suite.fixtures().createRoleConflictMember({ group, role: candidate });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: delegator, account: actor });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: existing, account });
            await suite.fixtures().createRoleDelegationPolicy({
                delegator,
                target: candidate,
                realm,
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().accountRoleAssignmentService.create({
                    input: {
                        roles: [candidate.id],
                        account,
                    },
                    actor,
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await loadAssignments(suite, account, realm);

            // Assert
            await expect(result).rejects.toThrow("services.account-role-assignment.HAS_SoD_VIOLATIONS");
            expect(result2).toHaveLength(1);
        });
    });

    describe("[Method] - ensure", () => {
        it("[case] - ensures an existing active assignment without creating a duplicate", async () => {
            // Arrange
            const actor = randomUUID();
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "assignment-ensure" });
            const delegator = await suite.fixtures().createRole({ code: "roles.delegator", name: "Delegator", realm });
            const role = await suite.fixtures().createRole({ code: "roles.existing", name: "Existing", realm });
            const existing = await suite.fixtures().createAccountRoleAssignment({ realm, role, account });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: delegator, account: actor });
            await suite.fixtures().createRoleDelegationPolicy({
                delegator,
                target: role,
                realm,
            });

            // Act
            const result = await suite.transaction((transaction) =>
                suite.repository().accountRoleAssignmentService.ensure({
                    input: {
                        role: role.id,
                        account,
                    },
                    actor,
                    realm: realm.id,
                    transaction,
                }),
            );
            const result2 = await countRoleAssignments(suite, account, realm);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(existing.id);
            expect(result2).toBe(1);
        });
    });

    describe("[Method] - assign", () => {
        it("[case] - assigns a role directly only inside its own realm", async () => {
            // Arrange
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "assignment-direct" });
            const foreignRealm = await suite.fixtures().createRealm({ code: "assignment-direct-foreign" });
            const role = await suite.fixtures().createRole({ code: "roles.direct", name: "Direct", realm });
            const created = await suite.transaction((transaction) =>
                suite.repository().accountRoleAssignmentService.assign({
                    input: {
                        realm: realm.id,
                        role: role.id,
                        account,
                    },
                    transaction,
                }),
            );

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().accountRoleAssignmentService.assign({
                    input: {
                        realm: foreignRealm.id,
                        role: role.id,
                        account,
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countRoleAssignments(suite, account, realm);

            const result3 = await countRoleAssignments(suite, account, foreignRealm);

            // Assert
            await expect(result).rejects.toThrow("db.NOT_FOUND");
            expect(created.role.id).toBe(role.id);
            expect(result2).toBe(1);
            expect(result3).toBe(0);
        });
    });

    describe("[Method] - expire", () => {
        it("[case] - expires only provided assignments through persisted merge and revoke", async () => {
            // Arrange
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "assignment-expire" });
            const expiredRole = await suite.fixtures().createRole({ code: "roles.expired", name: "Expired", realm });
            const activeRole = await suite.fixtures().createRole({ code: "roles.active", name: "Active", realm });
            const expired = await suite.fixtures().createAccountRoleAssignment({
                expiresAt: new Date("2026-01-01T00:00:00.000Z"),
                role: expiredRole,
                account,
                realm,
            });
            const active = await suite.fixtures().createAccountRoleAssignment({
                expiresAt: new Date("2999-01-01T00:00:00.000Z"),
                role: activeRole,
                account,
                realm,
            });

            // Act
            await suite.transaction((transaction) =>
                Promise.resolve(
                    suite.repository().accountRoleAssignmentService.expire({
                        entities: [expired],
                        transaction,
                    }),
                ),
            );

            const result = await loadAssignment(suite, expired.id);

            const result2 = await loadAssignment(suite, active.id);

            // Assert
            expect(result).toEqual(expect.objectContaining({ isRevoked: true }));
            expect(result2).toEqual(expect.objectContaining({ isRevoked: false }));
        });
    });
});
