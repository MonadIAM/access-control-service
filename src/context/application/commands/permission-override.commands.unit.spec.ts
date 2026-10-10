import { describe, expect, it } from "@jest/globals";

import { AccessCacheTopicAction, KafkaTopic, ActionType, EntityType, PermissionOverrideEffect } from "~context/enums";
import { PermissionOverrideCommandsUnitHelpers } from "~testing/unit/command-services/permission-override.helpers";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { SYSTEM_ACCOUNT_ID } from "~context/constants";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new PermissionOverrideCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("[Commands] - PermissionOverride", () => {
    describe("[Method] - create", () => {
        it("[case] - creates through the transaction and records the acting user's audit context", async () => {
            // Arrange
            const { commands, service, run, transaction, cache } = helpers.commands();
            const input: Commands.PermissionOverride.Create.Props["input"] = {
                account: "target-account",
                permission: "permission-a",
                effect: PermissionOverrideEffect.DENY,
                justification: "Restrict access",
            };
            service.create.mockResolvedValue(helpers.createPermissionOverride());
            cache.checkRealm.mockResolvedValue(true);

            // Act
            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(cache.checkRealm).toHaveBeenCalledWith({ account: "target-account", realm: REALM });
            expect(service.create.mock.calls).toEqual([[{ input, transaction: transaction.entityManager, realm: REALM }]]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.arrayContaining([
                        expect.objectContaining({
                            actionType: ProjectionScript.PERMISSION_OVERRIDE_CREATE,
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
                        entityType: EntityType.PERMISSION_OVERRIDE,
                    }),
                    changeLog: true,
                }),
            );
        });

        it("[case] - refuses overrides for a nonmember before starting any mutation", async () => {
            // Arrange
            const { commands, cache, service, run } = helpers.commands();
            cache.checkRealm.mockResolvedValue(false);

            // Act
            const result = commands.create({
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: {
                    account: "target-account",
                    permission: "permission-a",
                    effect: PermissionOverrideEffect.DENY,
                    justification: "Restrict access",
                },
            });

            // Assert
            await expect(result).rejects.toThrow("commands.permission-override.ACCOUNT_NOT_MEMBER");
            expect(cache.checkRealm).toHaveBeenCalledWith({ account: "target-account", realm: REALM });
            expect(run).not.toHaveBeenCalled();
            expect(service.create).not.toHaveBeenCalled();
        });
    });

    describe("[Behavior] - lifecycle", () => {
        it.each(["revoke", "restore", "purge"] as const)("[case] - scopes and audits the mutation (%s)", async (method) => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const changed = [helpers.createPermissionOverride(), helpers.createPermissionOverride()];
            service[method].mockResolvedValue(changed);
            const input = { identifiers: changed.map((entity) => entity.id), reason: "Lifecycle change" };

            // Act
            await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });
            const projection =
                method === "purge"
                    ? ProjectionScript.PERMISSION_OVERRIDE_PURGE
                    : ProjectionScript.PERMISSION_OVERRIDE_UPDATE;
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
            expect(result).toMatchObject({ overrides: changed });
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({ input, actor: ACTOR, context: CONTEXT }),
                    changeLog: true,
                }),
            );
        });
    });

    describe("[Method] - expire", () => {
        it("[case] - does not start a transaction when no expirable entities remain", async () => {
            // Arrange
            const { commands, repository, service, run } = helpers.commands();
            const now = new Date("2026-01-15T12:00:00.000Z");
            repository.find.mockResolvedValue([]);

            // Act
            const result = await commands.expire({ now, batchSize: 50 });

            // Assert
            expect(result).toBe(0);
            expect(repository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isRevoked: false, expiresAt: { $lte: now } },
                    options: expect.objectContaining({ limit: 50 }),
                }),
            );
            expect(run).not.toHaveBeenCalled();
            expect(service.expire).not.toHaveBeenCalled();
        });

        it("[case] - expires the selected batch in one transaction and audits its actual identifiers", async () => {
            // Arrange
            const { commands, repository, service, run, transaction } = helpers.commands();
            const now = new Date("2026-01-15T12:00:00.000Z");
            const entities = [helpers.createPermissionOverride(), helpers.createPermissionOverride()];
            repository.find.mockResolvedValue(entities);

            // Act
            const result = await commands.expire({ now, batchSize: 50 });

            // Assert
            expect(result).toBe(2);
            expect(service.expire.mock.calls).toEqual([[{ transaction: transaction.entityManager, entities }]]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    audit: expect.objectContaining({
                        actor: SYSTEM_ACCOUNT_ID,
                        input: {
                            identifiers: entities.map((entity) => entity.id),
                            expiresAt: now.toISOString(),
                            reason: "expired",
                        },
                    }),
                }),
            );
        });
    });
});
