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

describe("RoleConflictMemberService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("adds only new members to an active group", async () => {
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

        expect(members.map(({ role }) => role.code)).toEqual(["roles.candidate", "roles.existing"]);
    });

    it("rolls back member creation when the resulting group has violators", async () => {
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

        await expect(
            suite.transaction((transaction) =>
                suite.repository().roleConflictMemberService.create({
                    input: {
                        roles: [candidate.id],
                        group: group.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.role-conflict-member.HAS_ACCOUNTS_VIOLATING_RULE");

        await expect(loadMembers(suite, group)).resolves.toHaveLength(1);
    });

    it("purges revoked members without removing the group", async () => {
        const realm = await suite.fixtures().createRealm({ code: "conflict-member-purge" });
        const role = await suite.fixtures().createRole({ realm, code: "roles.revoked" });
        const group = await suite.fixtures().createRoleConflictGroup({
            code: "conflicts.members",
            name: "Members",
            maxAllowed: 1,
            realm,
        });
        const member = await suite.fixtures().createRoleConflictMember({ group, role, isRevoked: true });

        await suite.transaction((transaction) =>
            suite.repository().roleConflictMemberService.purge({
                identifiers: [member.id],
                realm: realm.id,
                transaction,
            }),
        );

        await expect(loadMembers(suite, group)).resolves.toHaveLength(0);
    });
});
