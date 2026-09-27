import { describe, expect, it } from "@jest/globals";

import { RoleDelegationPolicyCommandsUnitHelpers } from "~testing/unit/command-services/role-delegation-policy.helpers";
import { ActionType, EntityType } from "~context/enums";
import { SYSTEM_ACCOUNT_ID } from "~context/constants";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RoleDelegationPolicyCommandsUnitHelpers();
const ACTOR = "acting-account";
const REALM = "realm-a";

describe("RoleDelegationPolicyCommands", () => {
    describe("create", () => {
        it("creates through the transaction and records the acting user's audit context", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.RoleDelegationPolicy.Create.Props["input"] = {
                justification: "Delegate access",
                delegator: "delegator-role",
                target: "target-role",
                depthLimit: 2,
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
                        entityType: EntityType.DELEGATION_POLICY,
                    }),
                    changeLog: true,
                }),
            );
        });
    });

    describe("update", () => {
        it("passes only the requested patch to the domain while retaining the reason in audit", async () => {
            const { commands, service, run, transaction } = helpers.commands();
            const input: Commands.RoleDelegationPolicy.Update.Props["input"] = {
                patch: { depthLimit: 3 },
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
                const changed = [helpers.createRoleDelegationPolicy(), helpers.createRoleDelegationPolicy()];
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

    describe("expire", () => {
        it("does not start a transaction when no expirable entities remain", async () => {
            const { commands, repository, service, run } = helpers.commands();
            const now = new Date("2026-01-15T12:00:00.000Z");
            repository.find.mockResolvedValue([]);

            await expect(commands.expire({ now, batchSize: 50 })).resolves.toBe(0);

            expect(repository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isRevoked: false, expiresAt: { $lte: now } },
                    options: expect.objectContaining({ limit: 50 }),
                }),
            );
            expect(run).not.toHaveBeenCalled();
            expect(service.expire).not.toHaveBeenCalled();
        });

        it("expires the selected batch in one transaction and audits its actual identifiers", async () => {
            const { commands, repository, service, run, transaction } = helpers.commands();
            const now = new Date("2026-01-15T12:00:00.000Z");
            const entities = [helpers.createRoleDelegationPolicy(), helpers.createRoleDelegationPolicy()];
            repository.find.mockResolvedValue(entities);

            await expect(commands.expire({ now, batchSize: 50 })).resolves.toBe(2);

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
