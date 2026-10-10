import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { AccountRoleAssignmentCommandsUnitHelpers } from "~testing/unit/command-services/account-role-assignment.helpers";
import { SYSTEM_ACCOUNT_ID, SYSTEM_REALM_ID, SYSTEM_USER_ROLE_ID } from "~context/constants";
import { RealmTopicAction, KafkaTopic, AccessCacheTopicAction } from "~context/enums";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";

const ACCOUNT = "00000000-0000-4000-8000-000000000001";
const ACTOR = "00000000-0000-4000-8000-000000000002";
const REALM = "00000000-0000-4000-8000-000000000003";
const ROLE = "00000000-0000-4000-8000-000000000004";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new AccountRoleAssignmentCommandsUnitHelpers();

const CREATE: Commands.AccountRoleAssignment.Create.Props = {
    actor: ACTOR,
    realm: REALM,
    context: CONTEXT,
    input: { account: ACCOUNT, roles: [ROLE], justification: "Grant project access" },
};

const JOIN: Commands.AccountRoleAssignment.Join.Props = {
    incoming: { consumerKey: "access-control.realm.v1", event: "join-event" },
    input: { account: ACCOUNT, role: ROLE, process: "join-process", command: "join-command", membership: "membership" },
    actor: ACTOR,
    realm: REALM,
};

describe("[Commands] - AccountRoleAssignment", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - rejects granting a role to an account outside the realm without starting a transaction", async () => {
            // Arrange
            const { commands, cache, assignments, run } = helpers.commands();
            cache.checkRealm.mockResolvedValue(false);

            // Act
            const result = commands.create(CREATE);

            // Assert
            await expect(result).rejects.toThrow("commands.account-role-assignment.ACCOUNT_NOT_MEMBER");
            expect(cache.checkRealm).toHaveBeenCalledWith({ account: ACCOUNT, realm: REALM });
            expect(run).not.toHaveBeenCalled();
            expect(assignments.create).not.toHaveBeenCalled();
        });

        it("[case] - grants roles to a realm member using the requested account and acting user", async () => {
            // Arrange
            const { commands, cache, assignments, transaction } = helpers.commands();
            cache.checkRealm.mockResolvedValue(true);
            assignments.create.mockResolvedValue([]);

            // Act
            await commands.create(CREATE);

            // Assert
            expect(cache.checkRealm).toHaveBeenCalledWith({ account: ACCOUNT, realm: REALM });
            expect(assignments.create).toHaveBeenCalledWith({
                input: { ...CREATE.input, expiresAt: undefined },
                transaction: transaction.entityManager,
                realm: REALM,
                actor: ACTOR,
            });
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - rejects a batch that would remove the last assignment from any account", async () => {
            // Arrange
            const { commands, repository, cache, assignments, run } = helpers.commands();
            const realm = helpers.createRealm({ id: REALM });
            const role = helpers.createRole({ realm, id: ROLE });
            const first = helpers.createAccountRoleAssignment({ realm, role, account: ACCOUNT, isRevoked: true });
            const second = helpers.createAccountRoleAssignment({ realm, role, account: ACTOR, isRevoked: true });
            repository.find.mockResolvedValue([first, second]);
            cache.validateAssignments.mockResolvedValue({
                missing: [],
                groups: [
                    { account: ACCOUNT, realm: REALM, remaining: 1 },
                    { account: ACTOR, realm: REALM, remaining: 0 },
                ],
            });

            // Act
            const result = commands.purge({
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { identifiers: [first.id, second.id], reason: "Remove assignments" },
            });

            // Assert
            await expect(result).rejects.toThrow("commands.account-role-assignment.CANNOT_PURGE_LAST_ASSIGNMENT");
            expect(cache.validateAssignments).toHaveBeenCalledWith({
                items: [
                    { account: ACCOUNT, realm: REALM, role: ROLE },
                    { account: ACTOR, realm: REALM, role: ROLE },
                ],
            });
            expect(run).not.toHaveBeenCalled();
            expect(assignments.purge).not.toHaveBeenCalled();
        });

        it("[case] - allows removal when another assignment remains for the account", async () => {
            // Arrange
            const { commands, repository, cache, assignments, transaction } = helpers.commands();
            const realm = helpers.createRealm({ id: REALM });
            const assignment = helpers.createAccountRoleAssignment({ realm, account: ACCOUNT, isRevoked: true });
            repository.find.mockResolvedValue([assignment]);
            cache.validateAssignments.mockResolvedValue({
                missing: [],
                groups: [{ account: ACCOUNT, realm: REALM, remaining: 1 }],
            });

            // Act
            await commands.purge({
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { identifiers: [assignment.id], reason: "Remove assignment" },
            });

            // Assert
            expect(assignments.purge.mock.calls).toEqual([
                [{ transaction: transaction.entityManager, entities: [assignment] }],
            ]);
        });

        it("[case] - rejects an incomplete purge selection before consulting the projection", async () => {
            // Arrange
            const { commands, repository, cache, run } = helpers.commands();
            repository.find.mockResolvedValue([]);

            // Act
            const result = commands.purge({
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { identifiers: ["missing-assignment"], reason: "Remove access" },
            });

            // Assert
            await expect(result).rejects.toThrow("commands.account-role-assignment.ASSIGNMENTS_NOT_FOUND");
            expect(repository.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: { $in: ["missing-assignment"] }, realm: REALM } }),
            );
            expect(cache.validateAssignments).not.toHaveBeenCalled();
            expect(run).not.toHaveBeenCalled();
        });

        it("[case] - refuses to purge when the projection cannot validate all selected assignments", async () => {
            // Arrange
            const { commands, repository, cache, assignments, run } = helpers.commands();
            const entity = helpers.createAccountRoleAssignment();
            repository.find.mockResolvedValue([entity]);
            cache.validateAssignments.mockResolvedValue({ missing: [entity.id], groups: [] });

            // Act
            const result = commands.purge({
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { identifiers: [entity.id], reason: "Remove access" },
            });

            // Assert
            await expect(result).rejects.toThrow("commands.account-role-assignment.ASSIGNMENTS_NOT_FOUND");
            expect(assignments.purge).not.toHaveBeenCalled();
            expect(run).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - join", () => {
        it("[case] - turns a business refusal to join into a join rejection", async () => {
            // Arrange
            const { commands, assignments, transaction } = helpers.commands();
            const error = Exception.invariantViolation({
                messageKey: "services.account-role-assignment.HAS_SoD_VIOLATIONS",
            });
            assignments.ensure.mockRejectedValue(error);
            const reject = jest.spyOn(commands, "rejectJoin").mockResolvedValue();

            // Act
            await commands.join(JOIN);

            // Assert
            expect(assignments.ensure).toHaveBeenCalledWith({
                input: JOIN.input,
                actor: ACTOR,
                realm: REALM,
                transaction: transaction.entityManager,
            });
            expect(reject).toHaveBeenCalledWith({
                incoming: JOIN.incoming,
                request: { input: JOIN.input, actor: ACTOR, realm: REALM },
                reason: error.message,
            });
        });

        it.each([
            {
                name: "temporary dependency failure",
                error: Exception.externalServiceFailed({ messageKey: "dependency unavailable" }),
            },
            { name: "unexpected error", error: new Error("unexpected failure") },
        ])("[case] - propagates $name instead of rejecting the join request", async ({ error }) => {
            // Arrange
            const { commands, assignments } = helpers.commands();
            assignments.ensure.mockRejectedValue(error);
            const reject = jest.spyOn(commands, "rejectJoin").mockResolvedValue();

            // Act
            const result = commands.join(JOIN);

            // Assert
            await expect(result).rejects.toBe(error);
            expect(reject).not.toHaveBeenCalled();
        });

        it("[case] - ensures assignments for a join and schedules a correlated confirmation", async () => {
            // Arrange
            const { commands, assignments, consume, transaction } = helpers.commands();
            const entities = [helpers.createAccountRoleAssignment()];
            assignments.ensure.mockResolvedValue(entities);

            // Act
            await commands.join(JOIN);
            const result = await consume.mock.results[0].value;

            // Assert
            expect(assignments.ensure.mock.calls).toEqual([
                [{ input: JOIN.input, actor: ACTOR, realm: REALM, transaction: transaction.entityManager }],
            ]);
            expect(consume).toHaveBeenCalledWith(
                expect.objectContaining({
                    incoming: JOIN.incoming,
                    outbox: expect.arrayContaining([
                        expect.objectContaining({
                            actionType: RealmTopicAction.MEMBERSHIP_JOIN_CONFIRMED,
                            destinationTopic: KafkaTopic.REALM,
                        }),
                    ]),
                }),
            );
            expect(result).toMatchObject({
                value: { request: JOIN.input, actor: ACTOR, realm: REALM, assignments: entities },
            });
        });
    });

    describe("[Method] - expire", () => {
        it("[case] - does not start a transaction when no expirable entities remain", async () => {
            // Arrange
            const { commands, repository, assignments, run } = helpers.commands();
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
            expect(assignments.expire).not.toHaveBeenCalled();
        });

        it("[case] - expires the selected batch in one transaction and audits its actual identifiers", async () => {
            // Arrange
            const { commands, repository, assignments, run, transaction } = helpers.commands();
            const now = new Date("2026-01-15T12:00:00.000Z");
            const entities = [helpers.createAccountRoleAssignment(), helpers.createAccountRoleAssignment()];
            repository.find.mockResolvedValue(entities);

            // Act
            const result = await commands.expire({ now, batchSize: 50 });

            // Assert
            expect(result).toBe(2);
            expect(assignments.expire.mock.calls).toEqual([[{ transaction: transaction.entityManager, entities }]]);
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

    describe("[Method] - rejectJoin", () => {
        it("[case] - preserves join correlation when publishing a business rejection", async () => {
            // Arrange
            const { commands, consume } = helpers.commands();

            // Act
            await commands.rejectJoin({
                incoming: JOIN.incoming,
                request: { input: JOIN.input, actor: ACTOR, realm: REALM },
                reason: "Role conflict",
            });

            // Assert
            expect(consume).toHaveBeenCalledWith(
                expect.objectContaining({
                    incoming: JOIN.incoming,
                    destinationTopic: KafkaTopic.REALM,
                    actionType: RealmTopicAction.MEMBERSHIP_JOIN_REJECTED,
                    payload: {
                        actor: ACTOR,
                        realm: REALM,
                        input: expect.objectContaining({
                            process: JOIN.input.process,
                            command: JOIN.input.command,
                            membership: JOIN.input.membership,
                            account: ACCOUNT,
                            reason: "Role conflict",
                        }),
                    },
                }),
            );
        });
    });

    describe("[Method] - assign", () => {
        it("[case] - assigns the system user role to the incoming account", async () => {
            // Arrange
            const { commands, assignments, consume, transaction } = helpers.commands();
            const assignment = helpers.createAccountRoleAssignment();
            assignments.assign.mockResolvedValue(assignment);

            // Act
            await commands.assign({ incoming: JOIN.incoming, account: ACCOUNT });
            const result = await consume.mock.results[0].value;

            // Assert
            expect(assignments.assign.mock.calls).toEqual([
                [
                    {
                        transaction: transaction.entityManager,
                        input: { account: ACCOUNT, realm: SYSTEM_REALM_ID, role: SYSTEM_USER_ROLE_ID },
                    },
                ],
            ]);
            expect(result).toMatchObject({ value: { assignments: [assignment] } });
        });
    });

    describe("[Method] - clean", () => {
        it("[case] - cleans assignments and overrides for the same deleted account in one transaction", async () => {
            // Arrange
            const { commands, assignments, overrides, consume, transaction } = helpers.commands();
            const removedAssignments = [helpers.createAccountRoleAssignment()];
            const removedOverrides = [helpers.createPermissionOverride()];
            assignments.clean.mockResolvedValue(removedAssignments);
            overrides.clean.mockResolvedValue(removedOverrides);

            // Act
            await commands.clean({ incoming: JOIN.incoming, account: ACCOUNT });
            const expected = { transaction: transaction.entityManager, input: { account: ACCOUNT } };
            const result = await consume.mock.results[0].value;

            // Assert
            expect(assignments.clean.mock.calls).toEqual([[expected]]);
            expect(overrides.clean.mock.calls).toEqual([[expected]]);
            expect(result).toMatchObject({
                value: { assignments: removedAssignments, overrides: removedOverrides },
            });
            expect(consume).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.arrayContaining([
                        expect.objectContaining({ actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE }),
                        expect.objectContaining({ actionType: ProjectionScript.PERMISSION_OVERRIDE_PURGE }),
                        expect.objectContaining({ actionType: AccessCacheTopicAction.INVALIDATE }),
                    ]),
                }),
            );
        });
    });

    describe("[Behavior] - revocation", () => {
        it.each(["revoke", "restore"] as const)(
            "[case] - scopes assignment changes to the requested realm (%s)",
            async (method) => {
                // Arrange
                const { commands, assignments, run, transaction } = helpers.commands();
                const entities = [helpers.createAccountRoleAssignment(), helpers.createAccountRoleAssignment()];
                assignments[method].mockResolvedValue(entities);
                const input = { identifiers: entities.map((entity) => entity.id), reason: "Change access" };

                // Act
                await commands[method]({ actor: ACTOR, realm: REALM, context: CONTEXT, input });

                // Assert
                expect(assignments[method].mock.calls).toEqual([
                    [{ transaction: transaction.entityManager, realm: REALM, identifiers: input.identifiers }],
                ]);
                expect(run).toHaveBeenCalledWith(
                    expect.objectContaining({
                        outbox: expect.arrayContaining([
                            expect.objectContaining({
                                actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                                destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                            }),
                            expect.objectContaining({
                                actionType: AccessCacheTopicAction.INVALIDATE,
                                destinationTopic: KafkaTopic.ACCESS_CACHE,
                            }),
                        ]),
                    }),
                );
            },
        );
    });
});
