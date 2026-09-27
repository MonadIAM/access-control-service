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

describe("RoleCommands", () => {
    describe("create", () => {
        it("creates through the transaction and records the acting user's audit context", async () => {
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

            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

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

    describe("update", () => {
        it("passes only the requested patch to the domain while retaining the reason in audit", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.Role.Update.Props["input"] = {
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

    describe("revoke / restore", () => {
        it.each(["revoke", "restore"] as const)(
            "%s scopes the mutation and audits the requested identifiers",
            async (method) => {
                const { commands, service, run, transaction } = helpers.commands();
                const changed = [helpers.createRole(), helpers.createRole()];
                service[method].mockResolvedValue(changed);
                const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };

                await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

                expect(service[method].mock.calls).toEqual([
                    [{ identifiers: input.identifiers, transaction: transaction.entityManager, realm: REALM }],
                ]);
                const projection = ProjectionScript.ROLE_UPDATE;
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
                await expect(run.mock.results[0].value).resolves.toMatchObject({ roles: changed });

                expect(run).toHaveBeenCalledWith(
                    expect.objectContaining({
                        audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                        changeLog: true,
                    }),
                );
            },
        );
    });

    describe("move", () => {
        it("moves the requested hierarchy and schedules projection and cache updates", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const input = { target: "moving-role", targetParent: "new-parent", mode: MoveMode.SUBTREE };
            service.move.mockResolvedValue({ target: helpers.createRole(), steps: [] });

            await commands.move({ actor: ACTOR, realm: REALM, context: CONTEXT, input });

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

        it("propagates a failed hierarchy mutation instead of reporting success", async () => {
            const { commands, service } = helpers.commands();
            const error = new Error("hierarchy conflict");
            service.move.mockRejectedValue(error);

            await expect(
                commands.move({
                    actor: ACTOR,
                    realm: REALM,
                    context: CONTEXT,
                    input: { target: "role", targetParent: "parent", mode: MoveMode.SUBTREE },
                }),
            ).rejects.toBe(error);
        });
    });

    describe("purge", () => {
        it("purges one role through the domain and supplies it to the projection", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const role = helpers.createRole();
            service.purge.mockResolvedValue(role);

            await commands.purge({
                id: role.id,
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { reason: "Remove role" },
            });

            expect(service.purge.mock.calls).toEqual([
                [{ id: role.id, realm: REALM, transaction: transaction.entityManager }],
            ]);
            await expect(run.mock.results[0].value).resolves.toEqual({ roles: [role] });
        });
    });

    describe("purgeSubtree", () => {
        it("reports the number actually removed from a subtree and retains its root for invalidation", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const root = helpers.createRole();
            const entities = [root, helpers.createRole()];
            service.purgeSubtree.mockResolvedValue({ root, entities });

            await expect(
                commands.purgeSubtree({
                    id: root.id,
                    actor: ACTOR,
                    realm: REALM,
                    context: CONTEXT,
                    input: { reason: "Remove subtree" },
                }),
            ).resolves.toMatchObject({ params: { count: 2 } });

            expect(service.purgeSubtree.mock.calls).toEqual([
                [{ id: root.id, realm: REALM, transaction: transaction.entityManager }],
            ]);
            await expect(run.mock.results[0].value).resolves.toEqual({ root, entities });
        });
    });
});
