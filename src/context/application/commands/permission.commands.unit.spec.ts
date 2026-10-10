import { describe, expect, it } from "@jest/globals";

import { PermissionCommandsUnitHelpers } from "~testing/unit/command-services/permission.helpers";
import { AccessCacheTopicAction, KafkaTopic, ActionType, EntityType } from "~context/enums";
import { ProjectionScript } from "~context/infrastructure/scripts";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new PermissionCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("[Commands] - Permission", () => {
    describe("[Method] - create", () => {
        it("[case] - creates through the transaction and records the acting user's audit context", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.Permission.Create.Props["input"] = { code: "project.read", name: "Read project" };
            service.create.mockResolvedValue(helpers.createPermission());

            // Act
            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(service.create.mock.calls).toEqual([[{ input, transaction: transaction.entityManager, realm: REALM }]]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.objectContaining({
                        actionType: ProjectionScript.PERMISSION_CREATE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                        payloadMapper: expect.any(Function),
                    }),
                }),
            );
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({
                        input,
                        actor: ACTOR,
                        context: CONTEXT,
                        actionType: ActionType.CREATE,
                        entityType: EntityType.PERMISSION,
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
            const input: Commands.Permission.Update.Props["input"] = {
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
            const changed = [helpers.createPermission(), helpers.createPermission()];
            service[method].mockResolvedValue(changed);
            const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };
            const projection = method === "purge" ? ProjectionScript.PERMISSION_PURGE : ProjectionScript.PERMISSION_UPDATE;

            // Act
            await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });
            const result = await run.mock.results[0].value;

            // Assert
            expect(service[method].mock.calls).toEqual([
                [{ identifiers: input.identifiers, transaction: transaction.entityManager, realm: REALM }],
            ]);
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
            expect(result).toMatchObject({ permissions: changed });
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                    changeLog: true,
                }),
            );
        });
    });
});
