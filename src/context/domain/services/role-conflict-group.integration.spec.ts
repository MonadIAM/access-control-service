import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { RoleConflictGroupIntegrationHelpers } from "~testing/integration/domain-service/role-conflict-group.helpers";
import { RoleConflictGroup, RoleConflictMember } from "~context/domain/entities";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

const helpers = new RoleConflictGroupIntegrationHelpers();

async function loadGroups(
    suite: Integration.Domain.RoleConflictGroup.Suite,
    realm: Entities.Realm,
): Promise<Entities.RoleConflictGroup[]> {
    return await suite.transaction((transaction) =>
        transaction.find(RoleConflictGroup, { realm: realm.id }, { orderBy: { code: "asc" } }),
    );
}

async function loadMembers(
    suite: Integration.Domain.RoleConflictGroup.Suite,
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

describe("RoleConflictGroupService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates a conflict group and its members atomically", async () => {
        const realm = await suite.fixtures().createRealm({ code: "conflict-create" });
        const first = await suite.fixtures().createRole({ realm, code: "roles.first" });
        const second = await suite.fixtures().createRole({ realm, code: "roles.second" });

        await suite.transaction((transaction) =>
            suite.repository().roleConflictGroupService.create({
                input: {
                    description: "Exclusive roles",
                    members: [first.id, second.id],
                    code: "conflicts.exclusive",
                    name: "Exclusive",
                    maxAllowed: 1,
                },
                realm: realm.id,
                transaction,
            }),
        );

        const [group] = await loadGroups(suite, realm);
        const members = await loadMembers(suite, group);

        expect(group).toMatchObject({
            description: "Exclusive roles",
            code: "conflicts.exclusive",
            name: "Exclusive",
            maxAllowed: 1,
        });
        expect(members.map(({ role }) => role.code)).toEqual(["roles.first", "roles.second"]);
    });

    it("rolls back group creation when existing assignments violate the rule", async () => {
        const account = randomUUID();
        const realm = await suite.fixtures().createRealm({ code: "conflict-create-rollback" });
        const first = await suite.fixtures().createRole({ realm, code: "roles.first" });
        const second = await suite.fixtures().createRole({ realm, code: "roles.second" });

        await suite.fixtures().createAccountRoleAssignment({ realm, role: first, account });
        await suite.fixtures().createAccountRoleAssignment({ realm, role: second, account });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().roleConflictGroupService.create({
                    input: {
                        description: "Exclusive roles",
                        members: [first.id, second.id],
                        code: "conflicts.exclusive",
                        name: "Exclusive",
                        maxAllowed: 1,
                    },
                    realm: realm.id,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.role-conflict-group.HAS_ACCOUNTS_VIOLATING_RULE");

        await expect(loadGroups(suite, realm)).resolves.toHaveLength(0);
    });

    it("rolls back maxAllowed reduction when existing accounts would violate it", async () => {
        const account = randomUUID();
        const realm = await suite.fixtures().createRealm({ code: "conflict-update-rollback" });
        const first = await suite.fixtures().createRole({ realm, code: "roles.first" });
        const second = await suite.fixtures().createRole({ realm, code: "roles.second" });
        const group = await suite.fixtures().createRoleConflictGroup({
            code: "conflicts.two-of-two",
            name: "Two Of Two",
            maxAllowed: 2,
            realm,
        });

        await suite.fixtures().createRoleConflictMember({ group, role: first });
        await suite.fixtures().createRoleConflictMember({ group, role: second });
        await suite.fixtures().createAccountRoleAssignment({ realm, role: first, account });
        await suite.fixtures().createAccountRoleAssignment({ realm, role: second, account });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().roleConflictGroupService.update({
                    patch: { maxAllowed: 1 },
                    id: group.id,
                    realm: realm.id,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.role-conflict-group.HAS_ACCOUNTS_VIOLATING_RULE");

        await expect(loadGroups(suite, realm)).resolves.toEqual([expect.objectContaining({ maxAllowed: 2 })]);
    });

    it("rolls back restore when revoked groups have violating accounts", async () => {
        const account = randomUUID();
        const realm = await suite.fixtures().createRealm({ code: "conflict-restore-rollback" });
        const first = await suite.fixtures().createRole({ realm, code: "roles.first" });
        const second = await suite.fixtures().createRole({ realm, code: "roles.second" });
        const group = await suite.fixtures().createRoleConflictGroup({
            code: "conflicts.restore",
            name: "Restore",
            isRevoked: true,
            maxAllowed: 1,
            realm,
        });

        await suite.fixtures().createRoleConflictMember({ group, role: first });
        await suite.fixtures().createRoleConflictMember({ group, role: second });
        await suite.fixtures().createAccountRoleAssignment({ realm, role: first, account });
        await suite.fixtures().createAccountRoleAssignment({ realm, role: second, account });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().roleConflictGroupService.restore({
                    identifiers: [group.id],
                    realm: realm.id,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.role-conflict-group.HAS_ACCOUNTS_VIOLATING_RULE");

        await expect(loadGroups(suite, realm)).resolves.toEqual([expect.objectContaining({ isRevoked: true })]);
    });
});
