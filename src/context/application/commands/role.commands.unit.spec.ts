import { describe, expect, it } from "@jest/globals";

import { RoleCommandsUnitHelpers } from "~testing/unit/command-services/role.helpers";
import { ProjectionScript } from "~context/infrastructure/scripts";
import {
    AccessCacheTopicAction,
    RoleActorType,
    RoleArchetype,
    KafkaTopic,
    ActionType,
    EntityType,
    MoveMode,
} from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RoleCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("[Commands] - Role", () => {
    describe("[Method] - create", () => {
        it("[case] - creates through the transaction and records the acting user's audit context", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.Role.Create.Props["input"] = {
                code: "reader",
                name: "Reader",
                actorType: RoleActorType.HUMAN,
                archetype: RoleArchetype.ATOMIC,
                parent: "parent-role",
                children: ["child-role"],
            };
            service.create.mockResolvedValue({ entity: helpers.createRole(), parent: helpers.createRole() });

            // Act
            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(service.create.mock.calls).toEqual([[{ input, transaction: transaction.entityManager, realm: REALM }]]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.objectContaining({
                        actionType: ProjectionScript.ROLE_CREATE,
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
                        entityType: EntityType.ROLE,
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
            const input: Commands.Role.Update.Props["input"] = {
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

    describe("[Behavior] - revocation", () => {
        it.each(["revoke", "restore"] as const)("[case] - scopes and audits the mutation (%s)", async (method) => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const changed = [helpers.createRole(), helpers.createRole()];
            service[method].mockResolvedValue(changed);
            const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };

            // Act
            await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });
            const projection = ProjectionScript.ROLE_UPDATE;
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
            expect(result).toMatchObject({ roles: changed });
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                    changeLog: true,
                }),
            );
        });
    });

    describe("[Method] - move", () => {
        it("[case] - moves the requested hierarchy and schedules projection and cache updates", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const input = { target: "moving-role", targetParent: "new-parent", mode: MoveMode.SUBTREE };
            service.move.mockResolvedValue({ target: helpers.createRole(), steps: [] });

            // Act
            await commands.move({ actor: ACTOR, realm: REALM, context: CONTEXT, input });

            // Assert
            expect(service.move.mock.calls).toEqual([[{ ...input, realm: REALM, transaction: transaction.entityManager }]]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.arrayContaining([
                        expect.objectContaining({
                            actionType: ProjectionScript.ROLE_CLOSURE_UPDATE,
                            destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                        }),
                        expect.objectContaining({
                            actionType: AccessCacheTopicAction.INVALIDATE,
                            destinationTopic: KafkaTopic.ACCESS_CACHE,
                        }),
                    ]),
                }),
            );
        });

        it("[case] - propagates a failed hierarchy mutation instead of reporting success", async () => {
            // Arrange
            const { commands, service } = helpers.commands();
            const error = new Error("hierarchy conflict");
            service.move.mockRejectedValue(error);

            // Act
            const result = commands.move({
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { target: "role", targetParent: "parent", mode: MoveMode.SUBTREE },
            });

            // Assert
            await expect(result).rejects.toBe(error);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - purges one role through the domain and supplies it to the projection", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const role = helpers.createRole();
            service.purge.mockResolvedValue(role);

            // Act
            await commands.purge({
                id: role.id,
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { reason: "Remove role" },
            });
            const result = await run.mock.results[0].value;

            // Assert
            expect(service.purge.mock.calls).toEqual([
                [{ id: role.id, realm: REALM, transaction: transaction.entityManager }],
            ]);
            expect(result).toEqual({ roles: [role] });
        });
    });

    describe("[Method] - purgeSubtree", () => {
        it("[case] - reports the number actually removed from a subtree and retains its root for invalidation", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const root = helpers.createRole();
            const entities = [root, helpers.createRole()];
            service.purgeSubtree.mockResolvedValue({ root, entities });

            // Act
            const result = await commands.purgeSubtree({
                id: root.id,
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { reason: "Remove subtree" },
            });
            const result2 = await run.mock.results[0].value;

            // Assert
            expect(result).toMatchObject({ params: { count: 2 } });
            expect(service.purgeSubtree.mock.calls).toEqual([
                [{ id: root.id, realm: REALM, transaction: transaction.entityManager }],
            ]);
            expect(result2).toEqual({ root, entities });
        });
    });
});
