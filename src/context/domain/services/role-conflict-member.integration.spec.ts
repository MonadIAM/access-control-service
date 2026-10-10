import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { RoleConflictMemberIntegrationHelpers } from "~testing/integration/domain-service/role-conflict-member.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { RoleConflictMember } from "~context/domain/entities";

const helpers = new RoleConflictMemberIntegrationHelpers();

async function loadMembers(
    suite: Integration.Domain.RoleConflictMember.Suite,
    group: Entities.RoleConflictGroup,
): Promise<Entities.RoleConflictMember[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            RoleConflictMember,
            { group: group.id },
            { populate: ["role"], orderBy: { role: { code: "asc" } } },
        ),
    );
}

describe("[DomainService] - RoleConflictMember", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - adds only new members to an active group", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "conflict-member-create" });
            const existing = await suite.fixtures().createRole({ realm, code: "roles.existing" });
            const candidate = await suite.fixtures().createRole({ realm, code: "roles.candidate" });
            const group = await suite.fixtures().createRoleConflictGroup({
                code: "conflicts.members",
                name: "Members",
                maxAllowed: 1,
                realm,
            });
            await suite.fixtures().createRoleConflictMember({ group, role: existing });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().roleConflictMemberService.create({
                    input: {
                        roles: [existing.id, candidate.id],
                        group: group.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );
            const members = await loadMembers(suite, group);

            // Assert
            expect(members.map(({ role }) => role.code)).toEqual(["roles.candidate", "roles.existing"]);
        });

        it("[case] - rolls back member creation when the resulting group has violators", async () => {
            // Arrange
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "conflict-member-rollback" });
            const existing = await suite.fixtures().createRole({ realm, code: "roles.existing" });
            const candidate = await suite.fixtures().createRole({ realm, code: "roles.candidate" });
            const group = await suite.fixtures().createRoleConflictGroup({
                code: "conflicts.members",
                name: "Members",
                maxAllowed: 1,
                realm,
            });
            await suite.fixtures().createRoleConflictMember({ group, role: existing });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: existing, account });
            await suite.fixtures().createAccountRoleAssignment({ realm, role: candidate, account });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().roleConflictMemberService.create({
                    input: {
                        roles: [candidate.id],
                        group: group.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await loadMembers(suite, group);

            // Assert
            await expect(result).rejects.toThrow("services.role-conflict-member.HAS_ACCOUNTS_VIOLATING_RULE");
            expect(result2).toHaveLength(1);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - purges revoked members without removing the group", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "conflict-member-purge" });
            const role = await suite.fixtures().createRole({ realm, code: "roles.revoked" });
            const group = await suite.fixtures().createRoleConflictGroup({
                code: "conflicts.members",
                name: "Members",
                maxAllowed: 1,
                realm,
            });
            const member = await suite.fixtures().createRoleConflictMember({ group, role, isRevoked: true });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().roleConflictMemberService.purge({
                    identifiers: [member.id],
                    realm: realm.id,
                    transaction,
                }),
            );

            const result = await loadMembers(suite, group);

            // Assert
            expect(result).toHaveLength(0);
        });
    });
});
