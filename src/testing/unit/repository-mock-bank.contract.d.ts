declare namespace Unit {
    namespace Domain {
        namespace RepositoryMockBank {
            interface Contract extends EntityFactory.Contract {
                readonly repositories: Repositories.Signature;
            }

            namespace Repositories {
                type Props = {
                    readonly permissions?: Entities.Permission[];
                    readonly roles?: Entities.Role[];
                    readonly realm?: Entities.Realm;
                };

                type Result = RepositoryMocks.Contract;

                type Signature = (props?: Props) => Result;
            }
        }

        namespace RepositoryMocks {
            type Base = {
                resource: string;

                findUniqueOrThrow: Mock;
                findUnique: Mock;
                findMany: Mock;
                find: Mock;
            };

            type AccountRoleAssignment = Base & {
                wouldExceedRoleLimit: Mock;
            };

            type RolePermissionAssignment = Base & {
                wouldExceedPermissionLimit: Mock;
            };

            type PermissionOverride = Base & {
                wouldExceedOverrideLimit: Mock;
            };

            type RoleConflictMember = Base & {
                wouldExceedMemberLimit: Mock;
            };

            type RoleDelegationPolicy = Base & {
                wouldExceedPolicyLimit: Mock;
                existsTransitivePath: Mock;
                isDelegationAllowed: Mock;
            };

            type RoleConflictGroup = Base & {
                getGroupsViolatedByAccountQuery: Mock;
                hasGroupsWithViolatingAccounts: Mock;
                getAccountsViolatingRuleQuery: Mock;
                findGroupsViolatedByAccount: Mock;
                hasGroupsViolatedByAccount: Mock;
                findAccountsViolatingRule: Mock;
                hasAccountsViolatingRule: Mock;
                wouldExceedGroupLimit: Mock;
            };

            type RoleClosure = {
                decreaseTransitiveDepth: Mock;
                existsTransitivePath: Mock;
                insertNewHierarchy: Mock;
                moveSubtrees: Mock;
                move: Mock;
            };

            type Permission = Base & {
                wouldExceedPermissionLimit: Mock;
                findAccountsByPermissions: Mock;
                collectEffective: Mock;
                getLookupList: Mock;
                findEffective: Mock;
            };

            type Realm = Base & {
                wouldExceedRealmLimit: Mock;
                getLookupList: Mock;
            };

            type Role = Base & {
                wouldExceedRoleLimit: Mock;
                findAccountsByRoles: Mock;
                getHierarchyGraph: Mock;
                findDescendants: Mock;
                getDescendants: Mock;
                getLookupList: Mock;
                findDelegable: Mock;
                findEffective: Mock;
                findAncestors: Mock;
                getAncestors: Mock;
            };

            type AuditLog = Base;

            type ChangeLog = Base;

            interface Contract {
                readonly rolePermissionAssignments: RolePermissionAssignment;
                readonly accountRoleAssignments: AccountRoleAssignment;
                readonly roleDelegationPolicies: RoleDelegationPolicy;
                readonly permissionOverrides: PermissionOverride;
                readonly roleConflictMembers: RoleConflictMember;
                readonly roleConflictGroups: RoleConflictGroup;
                readonly roleClosures: RoleClosure;
                readonly permissions: Permission;
                readonly changeLogs: ChangeLog;
                readonly auditLogs: AuditLog;
                readonly realms: Realm;
                readonly roles: Role;
            }
        }
    }
}
