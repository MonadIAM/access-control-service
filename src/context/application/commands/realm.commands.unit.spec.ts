import { describe, expect, it } from "@jest/globals";

import { AccessCacheTopicAction, RealmTopicAction, KafkaTopic, ActionType, EntityType } from "~context/enums";
import { RealmCommandsUnitHelpers } from "~testing/unit/command-services/realm.helpers";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";

const INCOMING: TransactionManager.Service.IncomingMessage = { consumerKey: "realm-consumer", event: "incoming-event" };
const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RealmCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("[Commands] - Realm", () => {
    describe("[Method] - create", () => {
        it("[case] - creates through the transaction and records the acting user's audit context", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.Realm.Create.Props["input"] = { code: "project", name: "Project" };
            service.create.mockResolvedValue({
                realm: helpers.createRealm(),
                roles: [],
                paths: [],
                assignments: { role: [], permission: [] },
            });

            // Act
            await commands.create({ input, actor: ACTOR, context: CONTEXT });

            // Assert
            expect(service.create.mock.calls).toEqual([[{ input, transaction: transaction.entityManager, actor: ACTOR }]]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.objectContaining({
                        actionType: ProjectionScript.REALM_CREATE,
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
                        entityType: EntityType.REALM,
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
            const input: Commands.Realm.Update.Props["input"] = {
                patch: { name: "Updated name" },
                reason: "Administrative correction",
            };

            // Act
            await commands.update({ id: "entity-a", input, actor: ACTOR, context: CONTEXT });

            // Assert
            expect(service.update.mock.calls).toEqual([
                [{ id: "entity-a", patch: input.patch, transaction: transaction.entityManager }],
            ]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({ input, actor: ACTOR, actionType: ActionType.UPDATE }),
                }),
            );
        });
    });

    describe("[Behavior] - lifecycle", () => {
        it.each([
            { method: "revoke", global: false },
            { method: "restore", global: false },
            { method: "purge", global: false },
            { method: "revoke", global: true },
            { method: "restore", global: true },
            { method: "purge", global: true },
        ] as const)(
            "[case] - forwards global=$global and audits the requested identifiers ($method)",
            async ({ method, global }) => {
                // Arrange
                const { commands, service, run, transaction } = helpers.commands();
                const changed = [helpers.createRealm(), helpers.createRealm()];
                service[method].mockResolvedValue(changed);
                const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };

                // Act
                await commands[method]({ input, actor: ACTOR, context: CONTEXT, global });
                const projection = method === "purge" ? ProjectionScript.REALM_PURGE : ProjectionScript.REALM_UPDATE;
                const result = await run.mock.results[0].value;

                // Assert
                expect(service[method].mock.calls).toEqual([
                    [
                        {
                            transaction: transaction.entityManager,
                            identifiers: input.identifiers,
                            actor: ACTOR,
                            global,
                        },
                    ],
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
                expect(result).toMatchObject({ realms: changed });
                expect(run).toHaveBeenCalledWith(
                    expect.objectContaining({
                        audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                        changeLog: true,
                    }),
                );
            },
        );
    });

    describe("[Method] - bootstrapOrganization", () => {
        const request: Commands.Realm.BootstrapOrganization.Props = {
            incoming: INCOMING,
            actor: ACTOR,
            realm: REALM,
            input: { resource: "organization", process: "bootstrap-process", owner: "owner-account", name: "Organization" },
        };

        it("[case] - runs the domain operation with message correlation and schedules confirmation", async () => {
            // Arrange
            const { commands, service, consume, transaction } = helpers.commands();

            // Act
            const result: Awaited<Services.Realm.BootstrapOrganization.Result> = {
                realm: helpers.createRealm(),
                roles: [],
                paths: [],
                assignments: { role: [], permission: [] },
            };
            service.bootstrapOrganization.mockResolvedValue(result);
            await commands.bootstrapOrganization(request);
            const result2 = await consume.mock.results[0].value;

            // Assert
            expect(service.bootstrapOrganization.mock.calls).toEqual([
                [{ actor: ACTOR, realm: REALM, input: request.input, transaction: transaction.entityManager }],
            ]);
            expect(consume).toHaveBeenCalledTimes(1);
            expect(consume).toHaveBeenCalledWith(
                expect.objectContaining({
                    incoming: INCOMING,
                    outbox: expect.arrayContaining([
                        expect.objectContaining({
                            actionType: RealmTopicAction.BOOTSTRAP_CONFIRMED,
                            destinationTopic: KafkaTopic.REALM,
                        }),
                    ]),
                }),
            );
            expect(result2).toMatchObject({
                status: "processed",
                value: { ...result, request: { actor: ACTOR, realm: REALM, input: request.input } },
            });
        });

        it("[case] - turns a business refusal into a correlated rejection event", async () => {
            // Arrange
            const { commands, service, consume } = helpers.commands();
            const error = Exception.conflict({ messageKey: "realm operation refused" });
            service.bootstrapOrganization.mockRejectedValue(error);

            // Act
            await commands.bootstrapOrganization(request);

            // Assert
            expect(consume).toHaveBeenCalledTimes(2);
            expect(consume).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    incoming: INCOMING,
                    actionType: RealmTopicAction.BOOTSTRAP_REJECTED,
                    destinationTopic: KafkaTopic.REALM,
                    payload: expect.objectContaining({
                        actor: ACTOR,
                        realm: REALM,
                        input: expect.objectContaining({ process: request.input.process, reason: error.message }),
                    }),
                }),
            );
        });

        it.each([
            {
                name: "retryable dependency failure",
                error: Exception.externalServiceFailed({ messageKey: "dependency unavailable" }),
            },
            { name: "unexpected error", error: new Error("unexpected failure") },
        ])("[case] - propagates $name without producing a rejection", async ({ error }) => {
            // Arrange
            const { commands, service, consume } = helpers.commands();
            service.bootstrapOrganization.mockRejectedValue(error);

            // Act
            const result = commands.bootstrapOrganization(request);

            // Assert
            await expect(result).rejects.toBe(error);
            expect(consume).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - bootstrapProject", () => {
        const request: Commands.Realm.BootstrapProject.Props = {
            incoming: INCOMING,
            actor: ACTOR,
            realm: REALM,
            input: {
                resource: "project",
                process: "bootstrap-process",
                organizationRealm: "organization-realm",
                owner: "owner-account",
                name: "Project",
            },
        };

        it("[case] - runs the domain operation with message correlation and schedules confirmation", async () => {
            // Arrange
            const { commands, service, consume, transaction } = helpers.commands();

            // Act
            const result: Awaited<Services.Realm.BootstrapProject.Result> = {
                realm: helpers.createRealm(),
                roles: [],
                paths: [],
                assignments: { role: [], permission: [] },
            };
            service.bootstrapProject.mockResolvedValue(result);
            await commands.bootstrapProject(request);
            const result2 = await consume.mock.results[0].value;

            // Assert
            expect(service.bootstrapProject.mock.calls).toEqual([
                [{ actor: ACTOR, realm: REALM, input: request.input, transaction: transaction.entityManager }],
            ]);
            expect(consume).toHaveBeenCalledTimes(1);
            expect(consume).toHaveBeenCalledWith(
                expect.objectContaining({
                    incoming: INCOMING,
                    outbox: expect.arrayContaining([
                        expect.objectContaining({
                            actionType: RealmTopicAction.BOOTSTRAP_CONFIRMED,
                            destinationTopic: KafkaTopic.REALM,
                        }),
                    ]),
                }),
            );
            expect(result2).toMatchObject({
                status: "processed",
                value: { ...result, request: { actor: ACTOR, realm: REALM, input: request.input } },
            });
        });

        it("[case] - turns a business refusal into a correlated rejection event", async () => {
            // Arrange
            const { commands, service, consume } = helpers.commands();
            const error = Exception.conflict({ messageKey: "realm operation refused" });
            service.bootstrapProject.mockRejectedValue(error);

            // Act
            await commands.bootstrapProject(request);

            // Assert
            expect(consume).toHaveBeenCalledTimes(2);
            expect(consume).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    incoming: INCOMING,
                    actionType: RealmTopicAction.BOOTSTRAP_REJECTED,
                    destinationTopic: KafkaTopic.REALM,
                    payload: expect.objectContaining({
                        actor: ACTOR,
                        realm: REALM,
                        input: expect.objectContaining({ process: request.input.process, reason: error.message }),
                    }),
                }),
            );
        });

        it.each([
            {
                name: "retryable dependency failure",
                error: Exception.externalServiceFailed({ messageKey: "dependency unavailable" }),
            },
            { name: "unexpected error", error: new Error("unexpected failure") },
        ])("[case] - propagates $name without producing a rejection", async ({ error }) => {
            // Arrange
            const { commands, service, consume } = helpers.commands();
            service.bootstrapProject.mockRejectedValue(error);

            // Act
            const result = commands.bootstrapProject(request);

            // Assert
            await expect(result).rejects.toBe(error);
            expect(consume).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - transferOwnership", () => {
        const request: Commands.Realm.TransferOwnership.Props = {
            incoming: INCOMING,
            actor: ACTOR,
            realm: REALM,
            input: {
                organization: "organization",
                process: "transfer-process",
                previousOwner: "previous-owner",
                owner: "new-owner",
            },
        };

        it("[case] - runs the domain operation with message correlation and schedules confirmation", async () => {
            // Arrange
            const { commands, service, consume, transaction } = helpers.commands();

            // Act
            const result: Awaited<Services.Realm.TransferOwnership.Result> = {
                realm: helpers.createRealm(),
                previousAssignments: [],
                assignments: [],
            };
            service.transferOwnership.mockResolvedValue(result);
            await commands.transferOwnership(request);
            const result2 = await consume.mock.results[0].value;

            // Assert
            expect(service.transferOwnership.mock.calls).toEqual([
                [{ actor: ACTOR, realm: REALM, input: request.input, transaction: transaction.entityManager }],
            ]);
            expect(consume).toHaveBeenCalledTimes(1);
            expect(consume).toHaveBeenCalledWith(
                expect.objectContaining({
                    incoming: INCOMING,
                    outbox: expect.arrayContaining([
                        expect.objectContaining({
                            actionType: RealmTopicAction.TRANSFER_OWNERSHIP_CONFIRMED,
                            destinationTopic: KafkaTopic.REALM,
                        }),
                    ]),
                }),
            );
            expect(result2).toMatchObject({
                status: "processed",
                value: { ...result, request: { actor: ACTOR, realm: REALM, input: request.input } },
            });
        });

        it("[case] - turns a business refusal into a correlated rejection event", async () => {
            // Arrange
            const { commands, service, consume } = helpers.commands();
            const error = Exception.conflict({ messageKey: "realm operation refused" });
            service.transferOwnership.mockRejectedValue(error);

            // Act
            await commands.transferOwnership(request);

            // Assert
            expect(consume).toHaveBeenCalledTimes(2);
            expect(consume).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    incoming: INCOMING,
                    actionType: RealmTopicAction.TRANSFER_OWNERSHIP_REJECTED,
                    destinationTopic: KafkaTopic.REALM,
                    payload: expect.objectContaining({
                        actor: ACTOR,
                        realm: REALM,
                        input: expect.objectContaining({ process: request.input.process, reason: error.message }),
                    }),
                }),
            );
        });

        it.each([
            {
                name: "retryable dependency failure",
                error: Exception.externalServiceFailed({ messageKey: "dependency unavailable" }),
            },
            { name: "unexpected error", error: new Error("unexpected failure") },
        ])("[case] - propagates $name without producing a rejection", async ({ error }) => {
            // Arrange
            const { commands, service, consume } = helpers.commands();
            service.transferOwnership.mockRejectedValue(error);

            // Act
            const result = commands.transferOwnership(request);

            // Assert
            await expect(result).rejects.toBe(error);
            expect(consume).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Behavior] - system lifecycle", () => {
        it.each([
            { method: "revokeBySystem", action: RealmTopicAction.REVOKE, projection: ProjectionScript.REALM_UPDATE },
            { method: "restoreBySystem", action: RealmTopicAction.RESTORE, projection: ProjectionScript.REALM_UPDATE },
            { method: "purgeBySystem", action: RealmTopicAction.PURGE, projection: ProjectionScript.REALM_PURGE },
        ] as const)(
            "[case] - coordinates the realm lifecycle with its projection and invalidation ($method)",
            async ({ method, action, projection }) => {
                // Arrange
                const { commands, service, consume, transaction } = helpers.commands();
                const realms = [helpers.createRealm({ id: REALM })];
                service[method].mockResolvedValue(realms);

                // Act
                await commands[method]({ incoming: INCOMING, actor: ACTOR, realm: REALM });
                const result = await consume.mock.results[0].value;

                // Assert
                expect(service[method].mock.calls).toEqual([[{ realm: REALM, transaction: transaction.entityManager }]]);
                expect(consume).toHaveBeenCalledWith(
                    expect.objectContaining({
                        incoming: INCOMING,
                        outbox: expect.arrayContaining([
                            expect.objectContaining({ actionType: action, destinationTopic: KafkaTopic.REALM }),
                            expect.objectContaining({
                                actionType: projection,
                                destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                            }),
                            expect.objectContaining({
                                actionType: AccessCacheTopicAction.INVALIDATE,
                                destinationTopic: KafkaTopic.ACCESS_CACHE,
                            }),
                        ]),
                    }),
                );
                expect(result).toMatchObject({ value: { realms, actor: ACTOR } });
            },
        );
    });

    describe("[Behavior] - account access lifecycle", () => {
        it.each([
            {
                method: "purgeAccountAccess",
                assignment: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                override: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
            },
            {
                method: "revokeAccountAccess",
                assignment: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                override: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
            },
            {
                method: "restoreAccountAccess",
                assignment: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                override: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
            },
        ] as const)(
            "[case] - coordinates assignments and overrides for one account and realm ($method)",
            async ({ method, assignment, override }) => {
                // Arrange
                const { commands, service, consume, transaction } = helpers.commands();

                // Act
                const result = {
                    account: "target-account",
                    realm: REALM,
                    assignments: [helpers.createAccountRoleAssignment()],
                    overrides: [helpers.createPermissionOverride()],
                };
                service[method].mockResolvedValue(result);
                await commands[method]({
                    incoming: INCOMING,
                    actor: ACTOR,
                    realm: REALM,
                    input: { account: "target-account" },
                });
                const result2 = await consume.mock.results[0].value;

                // Assert
                expect(service[method].mock.calls).toEqual([
                    [{ account: "target-account", realm: REALM, transaction: transaction.entityManager }],
                ]);
                expect(consume).toHaveBeenCalledWith(
                    expect.objectContaining({
                        incoming: INCOMING,
                        outbox: expect.arrayContaining([
                            expect.objectContaining({
                                actionType: assignment,
                                destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                            }),
                            expect.objectContaining({
                                actionType: override,
                                destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                            }),
                            expect.objectContaining({
                                actionType: AccessCacheTopicAction.INVALIDATE,
                                destinationTopic: KafkaTopic.ACCESS_CACHE,
                            }),
                        ]),
                    }),
                );
                expect(result2).toMatchObject({ value: result });
            },
        );
    });
});
