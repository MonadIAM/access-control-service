declare namespace Unit.Domain {
    namespace RepositoryMockBank {
        interface Contract extends Testing.EntityFactory.Contract {
            repositories: Repositories.Signature;
        }

        namespace Repositories {
            type Props = {
                permissions?: Entities.Permission[];
                roles?: Entities.Role[];
                realm?: Entities.Realm;
            };

            type Result = RepositoryMocks.Contract;

            type Signature = (props?: Props) => Result;
        }
    }

    namespace RepositoryMocks {
        type Base = {
            resource: string;

            findUniqueOrThrow: Jest.Mock;
            findUnique: Jest.Mock;
            findMany: Jest.Mock;
            find: Jest.Mock;
        };

        type AccountRoleAssignment = Base & {
            wouldExceedRoleLimit: Jest.Mock;
        };

        type RolePermissionAssignment = Base & {
            wouldExceedPermissionLimit: Jest.Mock;
        };

        type PermissionOverride = Base & {
            wouldExceedOverrideLimit: Jest.Mock;
        };

        type RoleConflictMember = Base & {
            wouldExceedMemberLimit: Jest.Mock;
        };

        type RoleDelegationPolicy = Base & {
            wouldExceedPolicyLimit: Jest.Mock;
            existsTransitivePath: Jest.Mock;
            isDelegationAllowed: Jest.Mock;
        };

        type RoleConflictGroup = Base & {
            getGroupsViolatedByAccountQuery: Jest.Mock;
            hasGroupsWithViolatingAccounts: Jest.Mock;
            getAccountsViolatingRuleQuery: Jest.Mock;
            findGroupsViolatedByAccount: Jest.Mock;
            hasGroupsViolatedByAccount: Jest.Mock;
            findAccountsViolatingRule: Jest.Mock;
            hasAccountsViolatingRule: Jest.Mock;
            wouldExceedGroupLimit: Jest.Mock;
        };

        type RoleClosure = {
            decreaseTransitiveDepth: Jest.Mock;
            existsTransitivePath: Jest.Mock;
            insertNewHierarchy: Jest.Mock;
            moveSubtrees: Jest.Mock;
            move: Jest.Mock;
        };

        type Permission = Base & {
            wouldExceedPermissionLimit: Jest.Mock;
            findAccountsByPermissions: Jest.Mock;
            collectEffective: Jest.Mock;
            getLookupList: Jest.Mock;
            findEffective: Jest.Mock;
        };

        type Realm = Base & {
            wouldExceedRealmLimit: Jest.Mock;
            getLookupList: Jest.Mock;
        };

        type Role = Omit<Base, "findUniqueOrThrow"> & {
            findUniqueOrThrow: Jest.Mock<
                (props: Repositories.Base.FindUniqueOrThrow<Entities.Role, never, "*">) => Promise<Entities.Role>
            >;
            wouldExceedRoleLimit: Jest.Mock;
            findAccountsByRoles: Jest.Mock;
            getHierarchyGraph: Jest.Mock;
            findDescendants: Jest.Mock;
            getDescendants: Jest.Mock<Repositories.Role.GetDescendants.Signature>;
            getLookupList: Jest.Mock;
            findDelegable: Jest.Mock;
            findEffective: Jest.Mock;
            findAncestors: Jest.Mock;
            getAncestors: Jest.Mock;
        };

        type AuditLog = Base;

        type ChangeLog = Base;

        interface Contract {
            rolePermissionAssignments: RolePermissionAssignment;
            accountRoleAssignments: AccountRoleAssignment;
            roleDelegationPolicies: RoleDelegationPolicy;
            permissionOverrides: PermissionOverride;
            roleConflictMembers: RoleConflictMember;
            roleConflictGroups: RoleConflictGroup;
            roleClosures: RoleClosure;
            permissions: Permission;
            changeLogs: ChangeLog;
            auditLogs: AuditLog;
            realms: Realm;
            roles: Role;
        }
    }
}
