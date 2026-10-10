import { describe, expect, it } from "@jest/globals";

import { RoleDelegationPolicyCommandsUnitHelpers } from "~testing/unit/command-services/role-delegation-policy.helpers";
import { ActionType, EntityType } from "~context/enums";
import { SYSTEM_ACCOUNT_ID } from "~context/constants";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RoleDelegationPolicyCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("[Commands] - RoleDelegationPolicy", () => {
    describe("[Method] - create", () => {
        it("[case] - creates through the transaction and records the acting user's audit context", async () => {
            // Arrange
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.RoleDelegationPolicy.Create.Props["input"] = {
                justification: "Delegate access",
                delegator: "delegator-role",
                target: "target-role",
                depthLimit: 2,
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
                        entityType: EntityType.DELEGATION_POLICY,
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
            const input: Commands.RoleDelegationPolicy.Update.Props["input"] = {
                patch: { depthLimit: 3 },
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
            const changed = [helpers.createRoleDelegationPolicy(), helpers.createRoleDelegationPolicy()];
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
            const entities = [helpers.createRoleDelegationPolicy(), helpers.createRoleDelegationPolicy()];
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
