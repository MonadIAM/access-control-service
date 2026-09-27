import { describe, expect, it } from "@jest/globals";

import { RoleConflictGroupCommandsUnitHelpers } from "~testing/unit/command-services/role-conflict-group.helpers";
import { ActionType, EntityType } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RoleConflictGroupCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("RoleConflictGroupCommands", () => {
    describe("create", () => {
        it("creates through the transaction and records the acting user's audit context", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.RoleConflictGroup.Create.Props["input"] = {
                code: "sod",
                name: "Separation of duties",
                description: "Review conflict",
                members: ["role-a", "role-b"],
                maxAllowed: 1,
            };

            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

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

    describe("update", () => {
        it("passes only the requested patch to the domain while retaining the reason in audit", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.RoleConflictGroup.Update.Props["input"] = {
                patch: { name: "Updated name" },
                reason: "Administrative correction",
            };

            await commands.update({ id: "entity-a", input, actor: ACTOR, realm: REALM, context: CONTEXT });

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

    describe("revoke / restore / purge", () => {
        it.each(["revoke", "restore", "purge"] as const)(
            "%s scopes the mutation and audits the requested identifiers",
            async (method) => {
                const { commands, service, run, transaction } = helpers.commands();
                const changed = [helpers.createRoleConflictGroup(), helpers.createRoleConflictGroup()];
                service[method].mockResolvedValue(changed);
                const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };

                await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

                expect(service[method].mock.calls).toEqual([
                    [{ identifiers: input.identifiers, transaction: transaction.entityManager, realm: REALM }],
                ]);
                expect(run).toHaveBeenCalledWith(
                    expect.objectContaining({
                        audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                        changeLog: true,
                    }),
                );
            },
        );
    });
});
