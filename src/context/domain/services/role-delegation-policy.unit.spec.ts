import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { RoleDelegationPolicyUnitHelpers } from "~testing/unit/domain-service/role-delegation-policy.helpers";

import { RoleDelegationPolicy } from "../entities";

/* eslint-disable prettier/prettier */
const REALM_ID          = "00000000-0000-4000-8000-600000000001";
const DELEGATOR_ROLE_ID = "00000000-0000-4000-8000-600000000002";
const TARGET_ROLE_ID    = "00000000-0000-4000-8000-600000000003";
const POLICY_ID         = "00000000-0000-4000-8000-600000000004";
const SECOND_POLICY_ID  = "00000000-0000-4000-8000-600000000005";
/* eslint-enable prettier/prettier */

const helpers = new RoleDelegationPolicyUnitHelpers();

describe("[DomainService] - RoleDelegationPolicy", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it.each([
            {
                found: "delegator",
                messageKey: "services.role-delegation-policy.TARGET_ROLE_NOT_FOUND",
            },
            {
                found: "target",
                messageKey: "services.role-delegation-policy.DELEGATOR_ROLE_NOT_FOUND",
            },
            {
                found: "none",
                messageKey: "services.role-delegation-policy.BOTH_ROLES_NOT_FOUND",
            },
        ])("[case] - throws $messageKey when $found role lookup result is found", async ({ found, messageKey }) => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const delegator = helpers.createRole({ id: DELEGATOR_ROLE_ID, realm });
            const target = helpers.createRole({ id: TARGET_ROLE_ID, realm });
            const roleEntities = found === "delegator" ? [delegator] : found === "target" ? [target] : [];
            const { service, repositories, transaction } = helpers.service({ roles: [delegator, target], realm });
            repositories.roles.find.mockImplementation(() => Promise.resolve(roleEntities));

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    justification: "temporary delegation",
                    delegator: DELEGATOR_ROLE_ID,
                    target: TARGET_ROLE_ID,
                },
            });

            // Assert
            await expect(result).rejects.toThrow(messageKey);
            expect(repositories.roles.find).toHaveBeenCalledWith({
                where: { id: { $in: [DELEGATOR_ROLE_ID, TARGET_ROLE_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(repositories.roleDelegationPolicies.wouldExceedPolicyLimit).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - throws a self-delegation error before role lookup when delegator equals target", async () => {
            // Arrange
            const { service, repositories, transaction } = helpers.service();

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    justification: "self delegation",
                    delegator: DELEGATOR_ROLE_ID,
                    target: DELEGATOR_ROLE_ID,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-delegation-policy.SELF_DELEGATION_NOT_ALLOWED");
            expect(repositories.roles.find).not.toHaveBeenCalled();
            expect(repositories.realms.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - throws when the delegator policy limit would be exceeded", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const delegator = helpers.createRole({ id: DELEGATOR_ROLE_ID, realm });
            const target = helpers.createRole({ id: TARGET_ROLE_ID, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [delegator, target], realm });
            repositories.roleDelegationPolicies.wouldExceedPolicyLimit.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    justification: "temporary delegation",
                    delegator: DELEGATOR_ROLE_ID,
                    target: TARGET_ROLE_ID,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-delegation-policy.LIMIT_EXCEEDED");
            expect(repositories.roleDelegationPolicies.wouldExceedPolicyLimit).toHaveBeenCalledWith({
                delegator: DELEGATOR_ROLE_ID,
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - throws when a transitive delegation path already exists", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const delegator = helpers.createRole({ id: DELEGATOR_ROLE_ID, realm });
            const target = helpers.createRole({ id: TARGET_ROLE_ID, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [delegator, target], realm });
            repositories.roleDelegationPolicies.existsTransitivePath.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    justification: "temporary delegation",
                    delegator: DELEGATOR_ROLE_ID,
                    target: TARGET_ROLE_ID,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-delegation-policy.EXISTS_TRANSITIVE_PATH");
            expect(repositories.roleDelegationPolicies.existsTransitivePath).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                to: DELEGATOR_ROLE_ID,
                from: TARGET_ROLE_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - resolves delegator and target from an unordered repository result, validates, and persists", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const delegator = helpers.createRole({ id: DELEGATOR_ROLE_ID, realm });
            const target = helpers.createRole({ id: TARGET_ROLE_ID, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [target, delegator], realm });
            const canCreateSpy = jest.spyOn(RoleDelegationPolicy.prototype, "canCreate");

            // Act
            await service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    justification: "temporary delegation",
                    delegator: DELEGATOR_ROLE_ID,
                    target: TARGET_ROLE_ID,
                    depthLimit: 2,
                },
            });

            // Assert
            expect(repositories.roleDelegationPolicies.wouldExceedPolicyLimit).toHaveBeenCalledWith({
                delegator: DELEGATOR_ROLE_ID,
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).toHaveBeenCalledWith(
                expect.objectContaining({
                    justification: "temporary delegation",
                    depthLimit: 2,
                    delegator,
                    target,
                    realm,
                }),
            );
            expect(canCreateSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - update", () => {
        it("[case] - finds a policy in the realm and applies the patch", async () => {
            // Arrange
            const policy = helpers.createRoleDelegationPolicy({ id: POLICY_ID });
            const { service, repositories, transaction } = helpers.service({ realm: policy.realm });
            const updateSpy = jest.spyOn(policy, "update");
            repositories.roleDelegationPolicies.findUniqueOrThrow.mockImplementation(() => Promise.resolve(policy));

            // Act
            await service.update({
                patch: { justification: "Updated delegation" },
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: POLICY_ID,
            });

            // Assert
            expect(repositories.roleDelegationPolicies.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: POLICY_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(updateSpy).toHaveBeenCalledWith({ patch: { justification: "Updated delegation" } });
        });
    });

    describe("[Behavior] - revocation", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
        ] as const)("[case] - processes and returns the batch ($method)", async ({ method, isRevoked }) => {
            // Arrange
            const first = helpers.createRoleDelegationPolicy({ id: POLICY_ID, isRevoked });
            const second = helpers.createRoleDelegationPolicy({ id: SECOND_POLICY_ID, realm: first.realm, isRevoked });
            const { service, repositories, transaction } = helpers.service({ realm: first.realm });
            const firstOperationSpy = jest.spyOn(first, method);
            const secondOperationSpy = jest.spyOn(second, method);
            repositories.roleDelegationPolicies.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service[method]({
                identifiers: [POLICY_ID, SECOND_POLICY_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.roleDelegationPolicies.find).toHaveBeenCalledWith({
                where: { id: { $in: [POLICY_ID, SECOND_POLICY_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstOperationSpy).toHaveBeenCalledTimes(1);
            expect(secondOperationSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("[Method] - expire", () => {
        it("[case] - merges and revokes each provided policy", () => {
            // Arrange
            const { service, transaction } = helpers.service();
            const first = helpers.createRoleDelegationPolicy({ id: POLICY_ID });
            const second = helpers.createRoleDelegationPolicy({ id: SECOND_POLICY_ID });
            const firstRevokeSpy = jest.spyOn(first, "revoke");
            const secondRevokeSpy = jest.spyOn(second, "revoke");

            // Act
            service.expire({ transaction: transaction.entityManager, entities: [first, second] });

            // Assert
            expect(transaction.merge).toHaveBeenNthCalledWith(1, first);
            expect(transaction.merge).toHaveBeenNthCalledWith(2, second);
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - checks purge eligibility, removes found policies, and returns them", async () => {
            // Arrange
            const first = helpers.createRoleDelegationPolicy({ id: POLICY_ID, isRevoked: true });
            const second = helpers.createRoleDelegationPolicy({
                id: SECOND_POLICY_ID,
                realm: first.realm,
                isRevoked: true,
            });
            const { service, repositories, transaction } = helpers.service({ realm: first.realm });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");
            repositories.roleDelegationPolicies.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service.purge({
                identifiers: [POLICY_ID, SECOND_POLICY_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.roleDelegationPolicies.find).toHaveBeenCalledWith({
                where: { id: { $in: [POLICY_ID, SECOND_POLICY_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(secondCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenNthCalledWith(1, first);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, second);
            expect(result).toEqual([first, second]);
        });
    });

    describe("[Behavior] - bulk identifiers", () => {
        it.each([
            { method: "revoke", isRevoked: false },
            { method: "restore", isRevoked: true },
            { method: "purge", isRevoked: true },
        ] as const)("[case] - deduplicates repository lookup ($method)", async ({ method, isRevoked }) => {
            // Arrange
            const policy = helpers.createRoleDelegationPolicy({ id: POLICY_ID, isRevoked });
            const { service, repositories, transaction } = helpers.service({ realm: policy.realm });
            repositories.roleDelegationPolicies.find.mockImplementation(() => Promise.resolve([policy]));

            // Act
            const result = await service[method]({
                transaction: transaction.entityManager,
                identifiers: [POLICY_ID, POLICY_ID],
                realm: REALM_ID,
            });

            // Assert
            expect(result).toEqual([policy]);
            expect(repositories.roleDelegationPolicies.find).toHaveBeenCalledWith({
                where: { id: { $in: [POLICY_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
        });
    });
});
