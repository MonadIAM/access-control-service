import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { RoleConflictMemberUnitHelpers } from "~testing/unit/domain-service/role-conflict-member.helpers";

/* eslint-disable prettier/prettier */
const REALM_ID         = "00000000-0000-4000-8000-800000000001";
const GROUP_ID         = "00000000-0000-4000-8000-800000000002";
const ROLE_ID          = "00000000-0000-4000-8000-800000000003";
const SECOND_ROLE_ID   = "00000000-0000-4000-8000-800000000004";
const MEMBER_ID        = "00000000-0000-4000-8000-800000000005";
const SECOND_MEMBER_ID = "00000000-0000-4000-8000-800000000006";
/* eslint-enable prettier/prettier */

const helpers = new RoleConflictMemberUnitHelpers();

describe("RoleConflictMemberService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when not all roles are found in the target realm", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [role], realm });
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));

            await expect(
                service.create({
                    input: { group: GROUP_ID, roles: [ROLE_ID, SECOND_ROLE_ID] },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.role-conflict-member.ROLES_NOT_FOUND");

            expect(repositories.roles.find).toHaveBeenCalledWith({
                where: { id: { $in: [ROLE_ID, SECOND_ROLE_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(repositories.roleConflictMembers.wouldExceedMemberLimit).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("stops before limit and violator checks when the group cannot modify members", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, isRevoked: true, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [role], realm });
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));

            await expect(
                service.create({
                    input: { group: GROUP_ID, roles: [ROLE_ID] },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("entities.role-conflict-group.CANNOT_MODIFY_MEMBERS_REVOKED");

            expect(repositories.roleConflictMembers.wouldExceedMemberLimit).not.toHaveBeenCalled();
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("throws when adding roles would exceed the group member limit", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [role], realm });
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));
            repositories.roleConflictMembers.wouldExceedMemberLimit.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    input: { group: GROUP_ID, roles: [ROLE_ID] },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.role-conflict-member.MEMBER_LIMIT_EXCEEDED");

            expect(repositories.roleConflictMembers.wouldExceedMemberLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                group: GROUP_ID,
                count: 1,
            });
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("throws when the updated member set would violate existing account assignments", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const role = helpers.createRole({ id: ROLE_ID, realm });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, maxAllowed: 1, realm });
            const { service, repositories, transaction } = helpers.service({ roles: [role], realm });
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));
            repositories.roleConflictGroups.hasAccountsViolatingRule.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    input: { group: GROUP_ID, roles: [ROLE_ID] },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.role-conflict-member.HAS_ACCOUNTS_VIOLATING_RULE");

            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                identifiers: [ROLE_ID],
                realm: REALM_ID,
                maxAllowed: 1,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("checks existing and new role identifiers, then persists each new member", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const existingRole = helpers.createRole({ id: ROLE_ID, realm });
            const newRole = helpers.createRole({ id: SECOND_ROLE_ID, code: "role.second", realm });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, maxAllowed: 1, realm });
            const existingMember = helpers.createRoleConflictMember({ id: MEMBER_ID, group, role: existingRole });
            helpers.attachRoleConflictMembers({ group, members: [existingMember] });
            const { service, repositories, transaction } = helpers.service({ roles: [newRole], realm });
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));

            await service.create({
                input: { group: GROUP_ID, roles: [SECOND_ROLE_ID] },
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                identifiers: [ROLE_ID, SECOND_ROLE_ID],
                realm: REALM_ID,
                maxAllowed: 1,
            });
            expect(transaction.persist).toHaveBeenCalledTimes(1);
            expect(transaction.persist).toHaveBeenCalledWith(expect.objectContaining({ group, role: newRole }));
        });

        it("does not create another member or spend member limit for a role already in the group", async () => {
            const realm = helpers.createRealm({ id: REALM_ID });
            const existingRole = helpers.createRole({ id: ROLE_ID, realm });
            const newRole = helpers.createRole({ id: SECOND_ROLE_ID, code: "role.second", realm });
            const group = helpers.createRoleConflictGroup({ id: GROUP_ID, maxAllowed: 1, realm });
            const existingMember = helpers.createRoleConflictMember({ id: MEMBER_ID, group, role: existingRole });
            helpers.attachRoleConflictMembers({ group, members: [existingMember] });
            const { service, repositories, transaction } = helpers.service({ roles: [existingRole, newRole], realm });
            repositories.roleConflictGroups.findUniqueOrThrow.mockImplementation(() => Promise.resolve(group));

            await service.create({
                input: { group: GROUP_ID, roles: [ROLE_ID, SECOND_ROLE_ID] },
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.roleConflictMembers.wouldExceedMemberLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                group: GROUP_ID,
                count: 1,
            });
            expect(repositories.roleConflictGroups.hasAccountsViolatingRule).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                identifiers: [ROLE_ID, SECOND_ROLE_ID],
                realm: REALM_ID,
                maxAllowed: 1,
            });
            expect(transaction.persist).toHaveBeenCalledTimes(1);
            expect(transaction.persist).toHaveBeenCalledWith(expect.objectContaining({ group, role: newRole }));
        });
    });

    describe("purge", () => {
        it("checks purge eligibility, removes found members, and returns them", async () => {
            const first = helpers.createRoleConflictMember({ id: MEMBER_ID });
            const second = helpers.createRoleConflictMember({ id: SECOND_MEMBER_ID, group: first.group });
            const { service, repositories, transaction } = helpers.service({ realm: first.group.realm });
            const firstCanPurgeSpy = jest.spyOn(first, "canPurge");
            const secondCanPurgeSpy = jest.spyOn(second, "canPurge");
            repositories.roleConflictMembers.find.mockImplementation(() => Promise.resolve([first, second]));

            const result = await service.purge({
                identifiers: [MEMBER_ID, SECOND_MEMBER_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.roleConflictMembers.find).toHaveBeenCalledWith({
                where: { id: { $in: [MEMBER_ID, SECOND_MEMBER_ID] }, group: { realm: REALM_ID } },
                transaction: transaction.entityManager,
                options: { populate: ["group"] },
            });
            expect(firstCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(secondCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenNthCalledWith(1, first);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, second);
            expect(result).toEqual([first, second]);
        });
    });

    describe("bulk identifiers", () => {
        it("bulk identifiers: RoleConflictMemberService.purge deduplicates repository lookup", async () => {
            const member = helpers.createRoleConflictMember({ id: MEMBER_ID });
            const { service, repositories, transaction } = helpers.service({ realm: member.group.realm });
            repositories.roleConflictMembers.find.mockImplementation(() => Promise.resolve([member]));

            await expect(
                service.purge({
                    transaction: transaction.entityManager,
                    identifiers: [MEMBER_ID, MEMBER_ID],
                    realm: REALM_ID,
                }),
            ).resolves.toEqual([member]);

            expect(repositories.roleConflictMembers.find).toHaveBeenCalledWith({
                where: { id: { $in: [MEMBER_ID] }, group: { realm: REALM_ID } },
                transaction: transaction.entityManager,
                options: { populate: ["group"] },
            });
        });
    });
});
