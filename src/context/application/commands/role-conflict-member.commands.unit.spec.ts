import { describe, expect, it } from "@jest/globals";

import { RoleConflictMemberCommandsUnitHelpers } from "~testing/unit/command-services/role-conflict-member.helpers";
import { ActionType, EntityType } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RoleConflictMemberCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("[Commands] - RoleConflictMember", () => {
    describe("[Method] - create", () => {
        it("[case] - creates through the transaction and records the acting user's audit context", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.RoleConflictMember.Create.Props["input"] = {
                roles: ["role-a", "role-b"],
                group: "group-a",
            };

            // Act
            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(service.create.mock.calls).toEqual([[{ input, transaction: transaction.entityManager, realm: REALM }]]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({
                        input,
                        actor: ACTOR,
                        context: CONTEXT,
                        actionType: ActionType.CREATE,
                        entityType: EntityType.CONFLICT_MEMBER,
                    }),
                    changeLog: true,
                }),
            );
        });
    });

    describe("[Method] - purge", () => {
        it.each(["purge"] as const)("[case] - scopes and audits the mutation (%s)", async (method) => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const changed = [helpers.createRoleConflictMember(), helpers.createRoleConflictMember()];
            service[method].mockResolvedValue(changed);
            const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };

            // Act
            await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(service[method].mock.calls).toEqual([
                [{ identifiers: input.identifiers, transaction: transaction.entityManager, realm: REALM }],
            ]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                    changeLog: true,
                }),
            );
        });
    });
});
