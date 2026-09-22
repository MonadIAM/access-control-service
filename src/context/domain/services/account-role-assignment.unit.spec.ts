import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { AccountRoleAssignmentUnitHelpers } from "~testing/unit/domain-service/account-role-assignment.helpers";

import { AccountRoleAssignment } from "../entities";

/* eslint-disable prettier/prettier */
const REALM_ID             = "00000000-0000-4000-8000-000000000001";
const FOREIGN_REALM_ID     = "00000000-0000-4000-8000-000000000002";
const ACTOR_ID             = "00000000-0000-4000-8000-000000000003";
const ACCOUNT_ID           = "00000000-0000-4000-8000-000000000004";
const ROLE_ID              = "00000000-0000-4000-8000-000000000005";
const SECOND_ROLE_ID       = "00000000-0000-4000-8000-000000000006";
const ASSIGNMENT_ID        = "00000000-0000-4000-8000-000000000007";
const SECOND_ASSIGNMENT_ID = "00000000-0000-4000-8000-000000000008";
/* eslint-enable prettier/prettier */

const helpers = new AccountRoleAssignmentUnitHelpers();

function createRealm(props: Partial<Entities.Realm.Contract> = {}): Entities.Realm {
    return helpers.createRealm({ id: REALM_ID, ...props });
}

function createRole(props: Partial<Entities.Role.Contract> = {}): Entities.Role {
    return helpers.createRole({
        realm: createRealm(),
        id: ROLE_ID,
        ...props,
    });
}

function createSecondRole(props: Partial<Entities.Role.Contract> = {}): Entities.Role {
    return helpers.createRole({
        realm: createRealm(),
        code: "role.second",
        id: SECOND_ROLE_ID,
        ...props,
    });
}

function createServiceContext(
    props: Unit.Domain.AccountRoleAssignment.Service.Props = {},
): Unit.Domain.AccountRoleAssignment.Service.Result {
    const realm = props.realm ?? createRealm();
    const roles = props.roles ?? [createRole({ realm }), createSecondRole({ realm })];

    return helpers.service({ realm, roles });
}

function createProps(
    transaction: ORM.EntityManager,
    overrides: Partial<Services.AccountRoleAssignment.Create.Props["input"]> = {},
): Services.AccountRoleAssignment.Create.Props {
    return {
        actor: ACTOR_ID,
        realm: REALM_ID,
        transaction,
        input: {
            roles: [ROLE_ID, SECOND_ROLE_ID],
            account: ACCOUNT_ID,
            ...overrides,
        },
    };
}

describe("AccountRoleAssignmentService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when not all roles are found in the target realm", async () => {
            const realm = createRealm();
            const role = createRole({ realm });
            const secondRole = createSecondRole({ realm });
            const { service, repositories, transaction } = createServiceContext({ realm, roles: [role, secondRole] });
            repositories.roles.find.mockImplementation(() => Promise.resolve([role]));

            await expect(service.create(createProps(transaction.entityManager))).rejects.toThrow(
                "services.account-role-assignment.ROLES_NOT_FOUND",
            );

            expect(repositories.roles.find).toHaveBeenCalledWith({
                where: { id: { $in: [ROLE_ID, SECOND_ROLE_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(repositories.roleDelegationPolicies.isDelegationAllowed).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("throws when delegation is not allowed", async () => {
            const { service, repositories, transaction } = createServiceContext();
            repositories.roleDelegationPolicies.isDelegationAllowed.mockImplementation(() => Promise.resolve(false));

            await expect(service.create(createProps(transaction.entityManager))).rejects.toThrow(
                "services.account-role-assignment.DELEGATION_NOT_ALLOWED",
            );

            expect(repositories.roleDelegationPolicies.isDelegationAllowed).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                roles: [ROLE_ID, SECOND_ROLE_ID],
                realm: REALM_ID,
                actor: ACTOR_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("throws when the account role limit would be exceeded", async () => {
            const { service, repositories, transaction } = createServiceContext();
            repositories.accountRoleAssignments.wouldExceedRoleLimit.mockImplementation(() => Promise.resolve(true));

            await expect(service.create(createProps(transaction.entityManager))).rejects.toThrow(
                "services.account-role-assignment.ACCOUNT_ROLE_LIMIT_EXCEEDED",
            );

            expect(repositories.accountRoleAssignments.wouldExceedRoleLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                roles: [ROLE_ID, SECOND_ROLE_ID],
                account: ACCOUNT_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("throws when the account would violate separation-of-duties groups", async () => {
            const { service, repositories, transaction } = createServiceContext();
            repositories.roleConflictGroups.hasGroupsViolatedByAccount.mockImplementation(() => Promise.resolve(true));

            await expect(service.create(createProps(transaction.entityManager))).rejects.toThrow(
                "services.account-role-assignment.HAS_SoD_VIOLATIONS",
            );

            expect(repositories.roleConflictGroups.hasGroupsViolatedByAccount).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                roles: [ROLE_ID, SECOND_ROLE_ID],
                account: ACCOUNT_ID,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates one assignment per role, validates assignability, persists, and returns them", async () => {
            const realm = createRealm();
            const role = createRole({ realm });
            const secondRole = createSecondRole({ realm });
            const { service, transaction } = createServiceContext({ realm, roles: [role, secondRole] });
            const expiresAt = new Date("2999-01-02T12:00:00.000Z");
            const canAssignSpy = jest.spyOn(AccountRoleAssignment.prototype, "canAssign");

            const result = await service.create(
                createProps(transaction.entityManager, { justification: "temporary support", expiresAt }),
            );

            expect(result).toHaveLength(2);
            expect(result.map(({ role }) => role)).toEqual([role, secondRole]);
            expect(result).toEqual([
                expect.objectContaining({
                    justification: "temporary support",
                    account: ACCOUNT_ID,
                    realm,
                    role,
                }),
                expect.objectContaining({
                    justification: "temporary support",
                    account: ACCOUNT_ID,
                    role: secondRole,
                    realm,
                }),
            ]);
            expect(canAssignSpy).toHaveBeenCalledTimes(2);
            expect(transaction.persist).toHaveBeenNthCalledWith(1, result[0]);
            expect(transaction.persist).toHaveBeenNthCalledWith(2, result[1]);
        });
    });

    describe("ensure", () => {
        it("returns an active existing assignment and does not call create", async () => {
            const { service, repositories, transaction } = createServiceContext();
            const existing = helpers.createAccountRoleAssignment({ id: ASSIGNMENT_ID });
            const createSpy = jest.spyOn(service, "create");
            repositories.accountRoleAssignments.findUnique.mockImplementation(() => Promise.resolve(existing));

            const result = await service.ensure({
                input: { account: ACCOUNT_ID, role: ROLE_ID },
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
                realm: REALM_ID,
            });

            expect(result).toEqual([existing]);
            expect(repositories.accountRoleAssignments.findUnique).toHaveBeenCalledWith({
                options: { populate: ["realm", "role"] },
                transaction: transaction.entityManager,
                where: {
                    account: ACCOUNT_ID,
                    realm: REALM_ID,
                    role: ROLE_ID,
                },
            });
            expect(createSpy).not.toHaveBeenCalled();
        });

        it("creates a single-role assignment when no active assignment exists", async () => {
            const { service, repositories, transaction } = createServiceContext();
            const created = [helpers.createAccountRoleAssignment({ id: ASSIGNMENT_ID })];
            const createSpy = jest.spyOn(service, "create").mockImplementation(() => Promise.resolve(created));
            repositories.accountRoleAssignments.findUnique.mockImplementation(() => Promise.resolve(null));

            const result = await service.ensure({
                input: { account: ACCOUNT_ID, role: ROLE_ID },
                transaction: transaction.entityManager,
                actor: ACTOR_ID,
                realm: REALM_ID,
            });

            expect(result).toBe(created);
            expect(createSpy).toHaveBeenCalledWith({
                input: { account: ACCOUNT_ID, roles: [ROLE_ID] },
                transaction: transaction.entityManager,
                realm: REALM_ID,
                actor: ACTOR_ID,
            });
        });
    });

    describe("assign", () => {
        it("creates and persists an internal assignment without delegation, limit, or SoD checks", async () => {
            const realm = createRealm();
            const role = createRole({ realm });
            const { service, repositories, transaction } = createServiceContext({ realm, roles: [role] });
            const expiresAt = new Date("2999-01-02T12:00:00.000Z");

            const result = await service.assign({
                transaction: transaction.entityManager,
                input: {
                    account: ACCOUNT_ID,
                    realm: REALM_ID,
                    role: ROLE_ID,
                    expiresAt,
                },
            });

            expect(repositories.realms.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { id: REALM_ID },
            });
            expect(repositories.roles.findUniqueOrThrow.mock.calls).toContainEqual([
                {
                    where: { id: ROLE_ID, realm: REALM_ID },
                    transaction: transaction.entityManager,
                },
            ]);
            expect(result).toEqual(
                expect.objectContaining({
                    account: ACCOUNT_ID,
                    realm,
                    role,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
            expect(repositories.roleDelegationPolicies.isDelegationAllowed).not.toHaveBeenCalled();
            expect(repositories.accountRoleAssignments.wouldExceedRoleLimit).not.toHaveBeenCalled();
            expect(repositories.roleConflictGroups.hasGroupsViolatedByAccount).not.toHaveBeenCalled();
        });

        it("does not assign a role that belongs to another realm", async () => {
            const realm = createRealm();
            const role = createRole({ realm });
            const { service, repositories, transaction } = createServiceContext({ realm, roles: [role] });
            const foreignRealm = createRealm({
                code: "realm.foreign",
                id: FOREIGN_REALM_ID,
            });
            const foreignRole = createRole({
                code: "role.foreign",
                realm: foreignRealm,
                id: ROLE_ID,
            });
            repositories.roles.findUniqueOrThrow.mockImplementation(({ where }) => {
                return typeof where === "object" &&
                    "id" in where &&
                    "realm" in where &&
                    where.id === foreignRole.id &&
                    where.realm === foreignRealm.id
                    ? Promise.resolve(foreignRole)
                    : Promise.reject(new Error("role not found"));
            });

            await expect(
                service.assign({
                    input: { account: ACCOUNT_ID, realm: REALM_ID, role: ROLE_ID },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("role not found");

            expect(repositories.roles.findUniqueOrThrow.mock.calls).toContainEqual([
                {
                    where: { id: ROLE_ID, realm: REALM_ID },
                    transaction: transaction.entityManager,
                },
            ]);
            expect(transaction.persist).not.toHaveBeenCalled();
        });
    });

    describe("revoke / restore", () => {
        it.each([
            { method: "revoke", isRevoked: false, options: { populate: ["realm", "role"] } },
            { method: "restore", isRevoked: true, options: undefined },
        ] as const)("$method processes each found entity and returns the batch", async ({ method, isRevoked, options }) => {
            const { service, repositories, transaction } = createServiceContext();
            const first = helpers.createAccountRoleAssignment({ id: ASSIGNMENT_ID, isRevoked });
            const second = helpers.createAccountRoleAssignment({ id: SECOND_ASSIGNMENT_ID, isRevoked });
            const firstOperationSpy = jest.spyOn(first, method);
            const secondOperationSpy = jest.spyOn(second, method);
            repositories.accountRoleAssignments.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service[method]({
                identifiers: [ASSIGNMENT_ID, SECOND_ASSIGNMENT_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.accountRoleAssignments.find).toHaveBeenCalledWith({
                where: { id: { $in: [ASSIGNMENT_ID, SECOND_ASSIGNMENT_ID] }, realm: REALM_ID },
                ...(options && { options }),
                transaction: transaction.entityManager,
            });
            expect(firstOperationSpy).toHaveBeenCalledTimes(1);
            expect(secondOperationSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("bulk identifiers", () => {
        it.each([
            { method: "revoke", isRevoked: false, options: { populate: ["realm", "role"] } },
            { method: "restore", isRevoked: true, options: undefined },
        ] as const)("$method deduplicates repository lookup", async ({ method, isRevoked, options }) => {
            const { service, repositories, transaction } = createServiceContext();
            const assignment = helpers.createAccountRoleAssignment({ id: ASSIGNMENT_ID, isRevoked });
            repositories.accountRoleAssignments.find.mockImplementation(() => Promise.resolve([assignment]));

            const result = await service[method]({
                identifiers: [ASSIGNMENT_ID, ASSIGNMENT_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(result).toEqual([assignment]);
            expect(repositories.accountRoleAssignments.find).toHaveBeenCalledWith({
                where: { id: { $in: [ASSIGNMENT_ID] }, realm: REALM_ID },
                ...(options && { options }),
                transaction: transaction.entityManager,
            });
        });
    });

    describe("expire", () => {
        it("merges and revokes each provided assignment", () => {
            const { service, transaction } = createServiceContext();
            const first = helpers.createAccountRoleAssignment({ id: ASSIGNMENT_ID });
            const second = helpers.createAccountRoleAssignment({ id: SECOND_ASSIGNMENT_ID });
            const firstRevokeSpy = jest.spyOn(first, "revoke");
            const secondRevokeSpy = jest.spyOn(second, "revoke");

            service.expire({ transaction: transaction.entityManager, entities: [first, second] });

            expect(transaction.merge).toHaveBeenNthCalledWith(1, first);
            expect(transaction.merge).toHaveBeenNthCalledWith(2, second);
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("purge", () => {
        it("checks purge eligibility and removes each assignment", () => {
            const { service, transaction } = createServiceContext();
            const first = helpers.createAccountRoleAssignment({ id: ASSIGNMENT_ID, isRevoked: true });
            const second = helpers.createAccountRoleAssignment({ id: SECOND_ASSIGNMENT_ID, isRevoked: true });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");

            service.purge({ transaction: transaction.entityManager, entities: [first, second] });

            expect(firstCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(secondCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenNthCalledWith(1, first);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, second);
        });
    });

    describe("clean", () => {
        it("finds account assignments in an optional realm, removes them, and returns them", async () => {
            const { service, repositories, transaction } = createServiceContext();
            const first = helpers.createAccountRoleAssignment({ id: ASSIGNMENT_ID });
            const second = helpers.createAccountRoleAssignment({ id: SECOND_ASSIGNMENT_ID });
            repositories.accountRoleAssignments.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.clean({
                input: { account: ACCOUNT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.accountRoleAssignments.find).toHaveBeenCalledWith({
                where: { account: ACCOUNT_ID, realm: REALM_ID },
                options: { populate: ["realm", "role"] },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenNthCalledWith(1, first);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, second);
            expect(result).toEqual([first, second]);
        });
    });
});
