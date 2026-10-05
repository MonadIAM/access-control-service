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

describe("RealmCommands", () => {
    describe("create", () => {
        it("creates through the transaction and records the acting user's audit context", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.Realm.Create.Props["input"] = { code: "project", name: "Project" };
            service.create.mockResolvedValue({
                realm: helpers.createRealm(),
                roles: [],
                paths: [],
                assignments: { role: [], permission: [] },
            });

            await commands.create({ input, actor: ACTOR, context: CONTEXT });

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

    describe("update", () => {
        it("passes only the requested patch to the domain while retaining the reason in audit", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.Realm.Update.Props["input"] = {
                patch: { name: "Updated name" },
                reason: "Administrative correction",
            };

            await commands.update({ id: "entity-a", input, actor: ACTOR, context: CONTEXT });

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

    describe("revoke / restore / purge", () => {
        it.each([
            { method: "revoke", global: false },
            { method: "restore", global: false },
            { method: "purge", global: false },
            { method: "revoke", global: true },
            { method: "restore", global: true },
            { method: "purge", global: true },
        ] as const)("$method forwards global=$global and audits the requested identifiers", async ({ method, global }) => {
            const { commands, service, run, transaction } = helpers.commands();
            const changed = [helpers.createRealm(), helpers.createRealm()];
            service[method].mockResolvedValue(changed);
            const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };

            await commands[method]({ input, actor: ACTOR, context: CONTEXT, global });

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
            const projection = method === "purge" ? ProjectionScript.REALM_PURGE : ProjectionScript.REALM_UPDATE;
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
            await expect(run.mock.results[0].value).resolves.toMatchObject({ realms: changed });

            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                    changeLog: true,
                }),
            );
        });
    });

    describe("bootstrapOrganization", () => {
        const request: Commands.Realm.BootstrapOrganization.Props = {
            incoming: INCOMING,
            actor: ACTOR,
            realm: REALM,
            input: { resource: "organization", process: "bootstrap-process", owner: "owner-account", name: "Organization" },
        };

        it("runs the domain operation with message correlation and schedules confirmation", async () => {
            const { commands, service, consume, transaction } = helpers.commands();
            const result: Awaited<Services.Realm.BootstrapOrganization.Result> = {
                realm: helpers.createRealm(),
                roles: [],
                paths: [],
                assignments: { role: [], permission: [] },
            };
            service.bootstrapOrganization.mockResolvedValue(result);

            await commands.bootstrapOrganization(request);

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
            await expect(consume.mock.results[0].value).resolves.toMatchObject({
                status: "processed",
                value: { ...result, request: { actor: ACTOR, realm: REALM, input: request.input } },
            });
        });

        it("turns a business refusal into a correlated rejection event", async () => {
            const { commands, service, consume } = helpers.commands();
            const error = Exception.conflict({ messageKey: "realm operation refused" });
            service.bootstrapOrganization.mockRejectedValue(error);

            await commands.bootstrapOrganization(request);

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
        ])("propagates $name without producing a rejection", async ({ error }) => {
            const { commands, service, consume } = helpers.commands();
            service.bootstrapOrganization.mockRejectedValue(error);

            await expect(commands.bootstrapOrganization(request)).rejects.toBe(error);

            expect(consume).toHaveBeenCalledTimes(1);
        });
    });

    describe("bootstrapProject", () => {
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

        it("runs the domain operation with message correlation and schedules confirmation", async () => {
            const { commands, service, consume, transaction } = helpers.commands();
            const result: Awaited<Services.Realm.BootstrapProject.Result> = {
                realm: helpers.createRealm(),
                roles: [],
                paths: [],
                assignments: { role: [], permission: [] },
            };
            service.bootstrapProject.mockResolvedValue(result);

            await commands.bootstrapProject(request);

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
            await expect(consume.mock.results[0].value).resolves.toMatchObject({
                status: "processed",
                value: { ...result, request: { actor: ACTOR, realm: REALM, input: request.input } },
            });
        });

        it("turns a business refusal into a correlated rejection event", async () => {
            const { commands, service, consume } = helpers.commands();
            const error = Exception.conflict({ messageKey: "realm operation refused" });
            service.bootstrapProject.mockRejectedValue(error);

            await commands.bootstrapProject(request);

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
        ])("propagates $name without producing a rejection", async ({ error }) => {
            const { commands, service, consume } = helpers.commands();
            service.bootstrapProject.mockRejectedValue(error);

            await expect(commands.bootstrapProject(request)).rejects.toBe(error);

            expect(consume).toHaveBeenCalledTimes(1);
        });
    });

    describe("transferOwnership", () => {
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

        it("runs the domain operation with message correlation and schedules confirmation", async () => {
            const { commands, service, consume, transaction } = helpers.commands();
            const result: Awaited<Services.Realm.TransferOwnership.Result> = {
                realm: helpers.createRealm(),
                previousAssignments: [],
                assignments: [],
            };
            service.transferOwnership.mockResolvedValue(result);

            await commands.transferOwnership(request);

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
            await expect(consume.mock.results[0].value).resolves.toMatchObject({
                status: "processed",
                value: { ...result, request: { actor: ACTOR, realm: REALM, input: request.input } },
            });
        });

        it("turns a business refusal into a correlated rejection event", async () => {
            const { commands, service, consume } = helpers.commands();
            const error = Exception.conflict({ messageKey: "realm operation refused" });
            service.transferOwnership.mockRejectedValue(error);

            await commands.transferOwnership(request);

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
        ])("propagates $name without producing a rejection", async ({ error }) => {
            const { commands, service, consume } = helpers.commands();
            service.transferOwnership.mockRejectedValue(error);

            await expect(commands.transferOwnership(request)).rejects.toBe(error);

            expect(consume).toHaveBeenCalledTimes(1);
        });
    });

    describe("revokeBySystem / restoreBySystem / purgeBySystem", () => {
        it.each([
            { method: "revokeBySystem", action: RealmTopicAction.REVOKE, projection: ProjectionScript.REALM_UPDATE },
            { method: "restoreBySystem", action: RealmTopicAction.RESTORE, projection: ProjectionScript.REALM_UPDATE },
            { method: "purgeBySystem", action: RealmTopicAction.PURGE, projection: ProjectionScript.REALM_PURGE },
        ] as const)(
            "$method coordinates the realm lifecycle with its projection and invalidation",
            async ({ method, action, projection }) => {
                const { commands, service, consume, transaction } = helpers.commands();
                const realms = [helpers.createRealm({ id: REALM })];
                service[method].mockResolvedValue(realms);

                await commands[method]({ incoming: INCOMING, actor: ACTOR, realm: REALM });

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
                await expect(consume.mock.results[0].value).resolves.toMatchObject({ value: { realms, actor: ACTOR } });
            },
        );
    });

    describe("purgeAccountAccess / revokeAccountAccess / restoreAccountAccess", () => {
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
            "$method coordinates assignments and overrides for one account and realm",
            async ({ method, assignment, override }) => {
                const { commands, service, consume, transaction } = helpers.commands();
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
                await expect(consume.mock.results[0].value).resolves.toMatchObject({ value: result });
            },
        );
    });
});
