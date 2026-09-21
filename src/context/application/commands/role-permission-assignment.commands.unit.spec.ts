import { describe, expect, it } from "@jest/globals";

import { RolePermissionAssignmentCommandsUnitHelpers } from "~testing/unit/command-services/role-permission-assignment.helpers";
import { AccessCacheTopicAction, KafkaTopic, ActionType, EntityType } from "~context/enums";
import { ProjectionScript } from "~context/infrastructure/scripts";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RolePermissionAssignmentCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("RolePermissionAssignmentCommands", () => {
    it("creates through the transaction and records the acting user's audit context", async () => {
        const { commands, service, run, transaction } = helpers.commands();
        const input: Commands.RolePermissionAssignment.Create.Props["input"] = {
            role: "reader-role",
            permissions: ["permission-a", "permission-b"],
        };
        service.create.mockResolvedValue([helpers.createRolePermissionAssignment()]);

        await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

        expect(service.create.mock.calls).toEqual([[{ input, transaction: transaction.entityManager, realm: REALM }]]);
        expect(run).toHaveBeenCalledWith(
            expect.objectContaining({
                outbox: expect.arrayContaining([
                    expect.objectContaining({
                        actionType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_CREATE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    }),
                    expect.objectContaining({
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    }),
                ]),
            }),
        );

        expect(run).toHaveBeenCalledWith(
            expect.objectContaining({
                audit: expect.objectContaining({
                    input,
                    actor: ACTOR,
                    context: CONTEXT,
                    actionType: ActionType.CREATE,
                    entityType: EntityType.PERMISSION_ASSIGNMENT,
                }),
                changeLog: true,
            }),
        );
    });

    it.each(["revoke", "restore", "purge"] as const)(
        "%s scopes the mutation and audits the requested identifiers",
        async (method) => {
            const { commands, service, run, transaction } = helpers.commands();
            const changed = [helpers.createRolePermissionAssignment(), helpers.createRolePermissionAssignment()];
            service[method].mockResolvedValue(changed);
            const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };

            await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

            expect(service[method].mock.calls).toEqual([
                [{ identifiers: input.identifiers, transaction: transaction.entityManager, realm: REALM }],
            ]);
            const projection =
                method === "purge"
                    ? ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_PURGE
                    : ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE;
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.arrayContaining([
                        expect.objectContaining({
                            actionType: projection,
                            destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                            payloadMapper: expect.any(Function),
                        }),
                        expect.objectContaining({
                            actionType: AccessCacheTopicAction.INVALIDATE,
                            destinationTopic: KafkaTopic.ACCESS_CACHE,
                            payloadMapper: expect.any(Function),
                        }),
                    ]),
                }),
            );
            await expect(run.mock.results[0].value).resolves.toMatchObject({ assignments: changed });

            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                    changeLog: true,
                }),
            );
        },
    );
});
