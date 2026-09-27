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

describe("AccountRoleAssignmentCommands decisions", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("rejects granting a role to an account outside the realm without starting a transaction", async () => {
            const { commands, cache, assignments, run } = helpers.commands();
            cache.checkRealm.mockResolvedValue(false);

            await expect(commands.create(CREATE)).rejects.toThrow("commands.account-role-assignment.ACCOUNT_NOT_MEMBER");

            expect(cache.checkRealm).toHaveBeenCalledWith({ account: ACCOUNT, realm: REALM });
            expect(run).not.toHaveBeenCalled();
            expect(assignments.create).not.toHaveBeenCalled();
        });

        it("grants roles to a realm member using the requested account and acting user", async () => {
            const { commands, cache, assignments, transaction } = helpers.commands();
            cache.checkRealm.mockResolvedValue(true);
            assignments.create.mockResolvedValue([]);

            await commands.create(CREATE);

            expect(cache.checkRealm).toHaveBeenCalledWith({ account: ACCOUNT, realm: REALM });
            expect(assignments.create).toHaveBeenCalledWith({
                input: { ...CREATE.input, expiresAt: undefined },
                transaction: transaction.entityManager,
                realm: REALM,
                actor: ACTOR,
            });
        });
    });

    describe("purge", () => {
        it("rejects a batch that would remove the last assignment from any account", async () => {
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

            await expect(
                commands.purge({
                    actor: ACTOR,
                    realm: REALM,
                    context: CONTEXT,
                    input: { identifiers: [first.id, second.id], reason: "Remove assignments" },
                }),
            ).rejects.toThrow("commands.account-role-assignment.CANNOT_PURGE_LAST_ASSIGNMENT");

            expect(cache.validateAssignments).toHaveBeenCalledWith({
                items: [
                    { account: ACCOUNT, realm: REALM, role: ROLE },
                    { account: ACTOR, realm: REALM, role: ROLE },
                ],
            });
            expect(run).not.toHaveBeenCalled();
            expect(assignments.purge).not.toHaveBeenCalled();
        });

        it("allows removal when another assignment remains for the account", async () => {
            const { commands, repository, cache, assignments, transaction } = helpers.commands();
            const realm = helpers.createRealm({ id: REALM });
            const assignment = helpers.createAccountRoleAssignment({ realm, account: ACCOUNT, isRevoked: true });
            repository.find.mockResolvedValue([assignment]);
            cache.validateAssignments.mockResolvedValue({
                missing: [],
                groups: [{ account: ACCOUNT, realm: REALM, remaining: 1 }],
            });

            await commands.purge({
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                input: { identifiers: [assignment.id], reason: "Remove assignment" },
            });

            expect(assignments.purge.mock.calls).toEqual([
                [{ transaction: transaction.entityManager, entities: [assignment] }],
            ]);
        });

        it("rejects an incomplete purge selection before consulting the projection", async () => {
            const { commands, repository, cache, run } = helpers.commands();
            repository.find.mockResolvedValue([]);

            await expect(
                commands.purge({
                    actor: ACTOR,
                    realm: REALM,
                    context: CONTEXT,
                    input: { identifiers: ["missing-assignment"], reason: "Remove access" },
                }),
            ).rejects.toThrow("commands.account-role-assignment.ASSIGNMENTS_NOT_FOUND");

            expect(repository.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: { $in: ["missing-assignment"] }, realm: REALM } }),
            );
            expect(cache.validateAssignments).not.toHaveBeenCalled();
            expect(run).not.toHaveBeenCalled();
        });

        it("refuses to purge when the projection cannot validate all selected assignments", async () => {
            const { commands, repository, cache, assignments, run } = helpers.commands();
            const entity = helpers.createAccountRoleAssignment();
            repository.find.mockResolvedValue([entity]);
            cache.validateAssignments.mockResolvedValue({ missing: [entity.id], groups: [] });

            await expect(
                commands.purge({
                    actor: ACTOR,
                    realm: REALM,
                    context: CONTEXT,
                    input: { identifiers: [entity.id], reason: "Remove access" },
                }),
            ).rejects.toThrow("commands.account-role-assignment.ASSIGNMENTS_NOT_FOUND");

            expect(assignments.purge).not.toHaveBeenCalled();
            expect(run).not.toHaveBeenCalled();
        });
    });

    describe("join", () => {
        it("turns a business refusal to join into a join rejection", async () => {
            const { commands, assignments, transaction } = helpers.commands();
            const error = Exception.invariantViolation({
                messageKey: "services.account-role-assignment.HAS_SoD_VIOLATIONS",
            });
            assignments.ensure.mockRejectedValue(error);
            const reject = jest.spyOn(commands, "rejectJoin").mockResolvedValue();

            await commands.join(JOIN);

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
        ])("propagates $name instead of rejecting the join request", async ({ error }) => {
            const { commands, assignments } = helpers.commands();
            assignments.ensure.mockRejectedValue(error);
            const reject = jest.spyOn(commands, "rejectJoin").mockResolvedValue();

            await expect(commands.join(JOIN)).rejects.toBe(error);

            expect(reject).not.toHaveBeenCalled();
        });

        it("ensures assignments for a join and schedules a correlated confirmation", async () => {
            const { commands, assignments, consume, transaction } = helpers.commands();
            const entities = [helpers.createAccountRoleAssignment()];
            assignments.ensure.mockResolvedValue(entities);

            await commands.join(JOIN);

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
            await expect(consume.mock.results[0].value).resolves.toMatchObject({
                value: { request: JOIN.input, actor: ACTOR, realm: REALM, assignments: entities },
            });
        });
    });

    describe("expire", () => {
        it("does not start a transaction when no expirable entities remain", async () => {
            const { commands, repository, assignments, run } = helpers.commands();
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
            expect(assignments.expire).not.toHaveBeenCalled();
        });

        it("expires the selected batch in one transaction and audits its actual identifiers", async () => {
            const { commands, repository, assignments, run, transaction } = helpers.commands();
            const now = new Date("2026-01-15T12:00:00.000Z");
            const entities = [helpers.createAccountRoleAssignment(), helpers.createAccountRoleAssignment()];
            repository.find.mockResolvedValue(entities);

            await expect(commands.expire({ now, batchSize: 50 })).resolves.toBe(2);

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

    describe("rejectJoin", () => {
        it("preserves join correlation when publishing a business rejection", async () => {
            const { commands, consume } = helpers.commands();

            await commands.rejectJoin({
                incoming: JOIN.incoming,
                request: { input: JOIN.input, actor: ACTOR, realm: REALM },
                reason: "Role conflict",
            });

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

    describe("assign", () => {
        it("assigns the system user role to the incoming account", async () => {
            const { commands, assignments, consume, transaction } = helpers.commands();
            const assignment = helpers.createAccountRoleAssignment();
            assignments.assign.mockResolvedValue(assignment);

            await commands.assign({ incoming: JOIN.incoming, account: ACCOUNT });

            expect(assignments.assign.mock.calls).toEqual([
                [
                    {
                        transaction: transaction.entityManager,
                        input: { account: ACCOUNT, realm: SYSTEM_REALM_ID, role: SYSTEM_USER_ROLE_ID },
                    },
                ],
            ]);
            await expect(consume.mock.results[0].value).resolves.toMatchObject({ value: { assignments: [assignment] } });
        });
    });

    describe("clean", () => {
        it("cleans assignments and overrides for the same deleted account in one transaction", async () => {
            const { commands, assignments, overrides, consume, transaction } = helpers.commands();
            const removedAssignments = [helpers.createAccountRoleAssignment()];
            const removedOverrides = [helpers.createPermissionOverride()];
            assignments.clean.mockResolvedValue(removedAssignments);
            overrides.clean.mockResolvedValue(removedOverrides);

            await commands.clean({ incoming: JOIN.incoming, account: ACCOUNT });

            const expected = { transaction: transaction.entityManager, input: { account: ACCOUNT } };
            expect(assignments.clean.mock.calls).toEqual([[expected]]);
            expect(overrides.clean.mock.calls).toEqual([[expected]]);
            await expect(consume.mock.results[0].value).resolves.toMatchObject({
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

    describe("revoke / restore", () => {
        it.each(["revoke", "restore"] as const)("%s scopes assignment changes to the requested realm", async (method) => {
            const { commands, assignments, run, transaction } = helpers.commands();
            const entities = [helpers.createAccountRoleAssignment(), helpers.createAccountRoleAssignment()];
            assignments[method].mockResolvedValue(entities);
            const input = { identifiers: entities.map((entity) => entity.id), reason: "Change access" };

            await commands[method]({ actor: ACTOR, realm: REALM, context: CONTEXT, input });

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
        });
    });
});
