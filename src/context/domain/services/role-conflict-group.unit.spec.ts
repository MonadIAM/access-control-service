import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { RoleConflictGroupUnitHelpers } from "~testing/unit/domain-service/role-conflict-group.helpers";

/* eslint-disable prettier/prettier */
const REALM_ID        = "00000000-0000-4000-8000-700000000001";
const ROLE_ID         = "00000000-0000-4000-8000-700000000002";
const SECOND_ROLE_ID  = "00000000-0000-4000-8000-700000000003";
const GROUP_ID        = "00000000-0000-4000-8000-700000000004";
const SECOND_GROUP_ID = "00000000-0000-4000-8000-700000000005";
/* eslint-enable prettier/prettier */

const helpers = new RoleConflictGroupUnitHelpers();

describe("[DomainService] - RoleConflictGroup", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - throws before repository calls when the input member count exceeds config limit", async () => {
            // Arrange
            const { service, repositories, transaction } = helpers.service({ membersLimit: 1 });

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    description: "Mutually exclusive roles",
                    members: [ROLE_ID, SECOND_ROLE_ID],
                    code: "sod.finance",
                    name: "Finance SoD",
                    maxAllowed: 1,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-conflict-group.MEMBER_LIMIT_EXCEEDED");
            expect(repositories.realms.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(repositories.roles.find).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - throws when not all roles are found in the target realm", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [role], realm });

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    description: "Mutually exclusive roles",
                    members: [ROLE_ID, SECOND_ROLE_ID],
                    code: "sod.finance",
                    name: "Finance SoD",
                    maxAllowed: 1,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-conflict-group.ROLES_NOT_FOUND");
            expect(repositories.roles.find).toHaveBeenCalledWith({
                where: { id: { $in: [ROLE_ID, SECOND_ROLE_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(repositories.roleConflictGroups.wouldExceedGroupLimit).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - throws when the realm conflict group limit would be exceeded", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const first = helpers.createRole({ id: ROLE_ID, realm });
            const second = helpers.createRole({ id: SECOND_ROLE_ID, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [first, second], realm });
            repositories.roleConflictGroups.wouldExceedGroupLimit.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    description: "Mutually exclusive roles",
                    members: [ROLE_ID, SECOND_ROLE_ID],
                    code: "sod.finance",
                    name: "Finance SoD",
                    maxAllowed: 1,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-conflict-group.LIMIT_EXCEEDED");
            expect(repositories.roleConflictGroups.wouldExceedGroupLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - throws when existing account assignments would violate the new rule", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const first = helpers.createRole({ id: ROLE_ID, realm });
            const second = helpers.createRole({ id: SECOND_ROLE_ID, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [first, second], realm });
            repositories.roleConflictGroups.hasAccountsViolatingRule.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                input: {
                    description: "Mutually exclusive roles",
                    members: [ROLE_ID, SECOND_ROLE_ID],
                    code: "sod.finance",
                    name: "Finance SoD",
                    maxAllowed: 1,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-conflict-group.HAS_ACCOUNTS_VIOLATING_RULE");
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).toHaveBeenCalledWith({
                identifiers: [ROLE_ID, SECOND_ROLE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
                maxAllowed: 1,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - creates a group, persists members first, and then persists the group", async () => {
            // Arrange
            const realm = helpers.createRealm({ id: REALM_ID });
            const first = helpers.createRole({ id: ROLE_ID, realm });
            const second = helpers.createRole({ id: SECOND_ROLE_ID, realm });
            const { service, transaction } = helpers.service({ roles: [first, second], realm });

            // Act
            await service.create({
                realm: REALM_ID,
                transaction: transaction.entityManager,
                input: {
                    description: "Mutually exclusive roles",
                    members: [ROLE_ID, SECOND_ROLE_ID],
                    code: "sod.finance",
                    name: "Finance SoD",
                    maxAllowed: 1,
                },
            });

            // Assert
            expect(transaction.persist).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ group: expect.objectContaining({ code: "sod.finance" }), role: first }),
            );
            expect(transaction.persist).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ group: expect.objectContaining({ code: "sod.finance" }), role: second }),
            );
            expect(transaction.persist).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    description: "Mutually exclusive roles",
                    code: "sod.finance",
                    name: "Finance SoD",
                    maxAllowed: 1,
                    realm,
                }),
            );
        });
    });

    describe("[Method] - update", () => {
        it("[case] - does not check violators when maxAllowed is not lowered", async () => {
            // Arrange
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, maxAllowed: 2 });
            const { service, repositories, transaction } = helpers.service({ realm: group.realm });
            const updateSpy = jest.spyOn(group, "update");
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));

            // Act
            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated SoD" },
                realm: REALM_ID,
                id: GROUP_ID,
            });

            // Assert
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).not.toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalledWith({ patch: { name: "Updated SoD" } });
        });

        it("[case] - throws when lowering maxAllowed would create violators", async () => {
            // Arrange
            const role = helpers.createRole({ id: ROLE_ID });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, maxAllowed: 2, realm: role.realm });
            const member = helpers.createRoleConflictMember({ group, role });
            helpers.attachRoleConflictMembers({ group, members: [member] });
            const { service, repositories, transaction } = helpers.service({ realm: group.realm });
            const updateSpy = jest.spyOn(group, "update");
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));
            repositories.roleConflictGroups.hasAccountsViolatingRule.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.update({
                transaction: transaction.entityManager,
                patch: { maxAllowed: 1 },
                realm: REALM_ID,
                id: GROUP_ID,
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-conflict-group.HAS_ACCOUNTS_VIOLATING_RULE");
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                identifiers: [ROLE_ID],
                realm: group.realm.id,
                maxAllowed: 1,
            });
            expect(updateSpy).not.toHaveBeenCalled();
        });

        it("[case] - updates the group when lowering maxAllowed has no violators", async () => {
            // Arrange
            const role = helpers.createRole({ id: ROLE_ID });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, maxAllowed: 2, realm: role.realm });
            const member = helpers.createRoleConflictMember({ group, role });
            helpers.attachRoleConflictMembers({ group, members: [member] });
            const { service, repositories, transaction } = helpers.service({ realm: group.realm });
            const updateSpy = jest.spyOn(group, "update");
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));

            // Act
            await service.update({
                transaction: transaction.entityManager,
                patch: { maxAllowed: 1 },
                realm: REALM_ID,
                id: GROUP_ID,
            });

            // Assert
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                identifiers: [ROLE_ID],
                realm: group.realm.id,
                maxAllowed: 1,
            });
            expect(updateSpy).toHaveBeenCalledWith({ patch: { maxAllowed: 1 } });
        });

        it("[case] - checks violators when maxAllowed is lowered to zero", async () => {
            // Arrange
            const role = helpers.createRole({ id: ROLE_ID });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, maxAllowed: 2, realm: role.realm });
            const member = helpers.createRoleConflictMember({ group, role });
            helpers.attachRoleConflictMembers({ group, members: [member] });
            const { service, repositories, transaction } = helpers.service({ realm: group.realm });
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));

            // Act
            await service.update({
                transaction: transaction.entityManager,
                patch: { maxAllowed: 0 },
                realm: REALM_ID,
                id: GROUP_ID,
            });

            // Assert
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                identifiers: [ROLE_ID],
                realm: group.realm.id,
                maxAllowed: 0,
            });
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes found groups and returns them", async () => {
            // Arrange
            const first = helpers.createRoleConflictGroup({ id: GROUP_ID });
            const second = helpers.createRoleConflictGroup({ id: SECOND_GROUP_ID, realm: first.realm });
            const { service, repositories, transaction } = helpers.service({ realm: first.realm });
            const firstRevokeSpy = jest.spyOn(first, "revoke");
            const secondRevokeSpy = jest.spyOn(second, "revoke");
            repositories.roleConflictGroups.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service.revoke({
                identifiers: [GROUP_ID, SECOND_GROUP_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.roleConflictGroups.find).toHaveBeenCalledWith({
                where: { id: { $in: [GROUP_ID, SECOND_GROUP_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - throws when restoring groups would create violators", async () => {
            // Arrange
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ realm: group.realm });
            const restoreSpy = jest.spyOn(group, "restore");
            repositories.roleConflictGroups.find.mockImplementation(() => Promise.resolve([group]));
            repositories.roleConflictGroups.hasGroupsWithViolatingAccounts.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.restore({
                transaction: transaction.entityManager,
                identifiers: [GROUP_ID],
                realm: REALM_ID,
            });

            // Assert
            await expect(result).rejects.toThrow("services.role-conflict-group.HAS_ACCOUNTS_VIOLATING_RULE");
            expect(repositories.roleConflictGroups.hasGroupsWithViolatingAccounts).toHaveBeenCalledWith({
                groups: [GROUP_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(restoreSpy).not.toHaveBeenCalled();
        });

        it("[case] - restores found groups when no accounts violate them", async () => {
            // Arrange
            const first = helpers.createRoleConflictGroup({ id: GROUP_ID, isRevoked: true });
            const second = helpers.createRoleConflictGroup({ id: SECOND_GROUP_ID, isRevoked: true, realm: first.realm });
            const { service, repositories, transaction } = helpers.service({ realm: first.realm });
            const firstRestoreSpy = jest.spyOn(first, "restore");
            const secondRestoreSpy = jest.spyOn(second, "restore");
            repositories.roleConflictGroups.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service.restore({
                identifiers: [GROUP_ID, SECOND_GROUP_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.roleConflictGroups.hasGroupsWithViolatingAccounts).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                groups: [GROUP_ID, SECOND_GROUP_ID],
                realm: REALM_ID,
            });
            expect(firstRestoreSpy).toHaveBeenCalledTimes(1);
            expect(secondRestoreSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([first, second]);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - checks purge eligibility, removes found groups, and returns them", async () => {
            // Arrange
            const first = helpers.createRoleConflictGroup({ id: GROUP_ID, isRevoked: true });
            const second = helpers.createRoleConflictGroup({ id: SECOND_GROUP_ID, isRevoked: true, realm: first.realm });
            const { service, repositories, transaction } = helpers.service({ realm: first.realm });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");
            repositories.roleConflictGroups.find.mockImplementation(() => Promise.resolve([first, second]));

            // Act
            const result = await service.purge({
                identifiers: [GROUP_ID, SECOND_GROUP_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.roleConflictGroups.find).toHaveBeenCalledWith({
                where: { id: { $in: [GROUP_ID, SECOND_GROUP_ID] }, realm: REALM_ID },
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
            { method: "purge", isRevoked: true },
        ] as const)("[case] - deduplicates repository lookup ($method)", async ({ method, isRevoked }) => {
            // Arrange
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, isRevoked });
            const { service, repositories, transaction } = helpers.service({ realm: group.realm });
            repositories.roleConflictGroups.find.mockImplementation(() => Promise.resolve([group]));

            // Act
            const result = await service[method]({
                identifiers: [GROUP_ID, GROUP_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(result).toEqual([group]);
            expect(repositories.roleConflictGroups.find).toHaveBeenCalledWith({
                where: { id: { $in: [GROUP_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
        });

        it("[case] - restores checks SoD violations with deduplicated group identifiers", async () => {
            // Arrange
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ realm: group.realm });
            repositories.roleConflictGroups.find.mockImplementation(() => Promise.resolve([group]));

            // Act
            const result = await service.restore({
                identifiers: [GROUP_ID, GROUP_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(result).toEqual([group]);
            expect(repositories.roleConflictGroups.find).toHaveBeenCalledWith({
                where: { id: { $in: [GROUP_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(repositories.roleConflictGroups.hasGroupsWithViolatingAccounts).toHaveBeenCalledWith({
                groups: [GROUP_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
        });
    });
});
