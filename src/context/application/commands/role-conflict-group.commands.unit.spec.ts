import { describe, expect, it } from "@jest/globals";

import { RoleConflictGroupCommandsUnitHelpers } from "~testing/unit/command-services/role-conflict-group.helpers";
import { ActionType, EntityType } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RoleConflictGroupCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("[Commands] - RoleConflictGroup", () => {
    describe("[Method] - create", () => {
        it("[case] - creates through the transaction and records the acting user's audit context", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.RoleConflictGroup.Create.Props["input"] = {
                code: "sod",
                name: "Separation of duties",
                description: "Review conflict",
                members: ["role-a", "role-b"],
                maxAllowed: 1,
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
                        entityType: EntityType.CONFLICT_GROUP,
                    }),
                    changeLog: true,
                }),
            );
        });
    });

    describe("[Method] - update", () => {
        it("[case] - passes only the requested patch to the domain while retaining the reason in audit", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.RoleConflictGroup.Update.Props["input"] = {
                patch: { name: "Updated name" },
                reason: "Administrative correction",
            };

            // Act
            await commands.update({ id: "entity-a", input, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(service.update.mock.calls).toEqual([
                [{ id: "entity-a", patch: input.patch, transaction: transaction.entityManager, realm: REALM }],
            ]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({ input, actor: ACTOR, actionType: ActionType.UPDATE }),
                }),
            );
        });
    });

    describe("[Behavior] - lifecycle", () => {
        it.each(["revoke", "restore", "purge"] as const)("[case] - scopes and audits the mutation (%s)", async (method) => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const changed = [helpers.createRoleConflictGroup(), helpers.createRoleConflictGroup()];
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
