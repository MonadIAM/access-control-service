import { jest } from "@jest/globals";

import { EntityFactoryRegistry } from "./entity-factory.registry";

export class RepositoryMockBank extends EntityFactoryRegistry implements Unit.Domain.RepositoryMockBank.Contract {
    public repositories(
        props: Unit.Domain.RepositoryMockBank.Repositories.Props = {},
    ): Unit.Domain.RepositoryMocks.Contract {
        const realm = props.realm ?? this.createRealm();
        const roles = props.roles ?? [this.createRole({ realm })];
        const permissions = props.permissions ?? [this.createPermission({ realm })];

        return {
            rolePermissionAssignments: this.rolePermissionAssignmentRepository(),
            accountRoleAssignments: this.accountRoleAssignmentRepository(),
            roleDelegationPolicies: this.roleDelegationPolicyRepository(),
            permissionOverrides: this.permissionOverrideRepository(),
            roleConflictMembers: this.roleConflictMemberRepository(),
            roleConflictGroups: this.roleConflictGroupRepository(),
            permissions: this.permissionRepository(permissions),
            roleClosures: this.roleClosureRepository(),
            changeLogs: this.changeLogRepository(),
            auditLogs: this.auditLogRepository(),
            realms: this.realmRepository(realm),
            roles: this.roleRepository(roles),
        };
    }

    private rolePermissionAssignmentRepository(): Unit.Domain.RepositoryMocks.RolePermissionAssignment {
        return {
            ...this.baseRepository("RolePermissionAssignment"),
            wouldExceedPermissionLimit: jest.fn(() => Promise.resolve(false)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private accountRoleAssignmentRepository(): Unit.Domain.RepositoryMocks.AccountRoleAssignment {
        return {
            ...this.baseRepository("AccountRoleAssignment"),
            wouldExceedRoleLimit: jest.fn(() => Promise.resolve(false)),
            findUnique: jest.fn(() => Promise.resolve(null)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private permissionOverrideRepository(): Unit.Domain.RepositoryMocks.PermissionOverride {
        return {
            ...this.baseRepository("PermissionOverride"),
            wouldExceedOverrideLimit: jest.fn(() => Promise.resolve(false)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private roleDelegationPolicyRepository(): Unit.Domain.RepositoryMocks.RoleDelegationPolicy {
        return {
            ...this.baseRepository("RoleDelegationPolicy"),
            wouldExceedPolicyLimit: jest.fn(() => Promise.resolve(false)),
            existsTransitivePath: jest.fn(() => Promise.resolve(false)),
            isDelegationAllowed: jest.fn(() => Promise.resolve(true)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private roleConflictMemberRepository(): Unit.Domain.RepositoryMocks.RoleConflictMember {
        return {
            ...this.baseRepository("RoleConflictMember"),
            wouldExceedMemberLimit: jest.fn(() => Promise.resolve(false)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private roleConflictGroupRepository(): Unit.Domain.RepositoryMocks.RoleConflictGroup {
        return {
            ...this.baseRepository("RoleConflictGroup"),
            hasGroupsWithViolatingAccounts: jest.fn(() => Promise.resolve(false)),
            hasGroupsViolatedByAccount: jest.fn(() => Promise.resolve(false)),
            findGroupsViolatedByAccount: jest.fn(() => Promise.resolve([])),
            hasAccountsViolatingRule: jest.fn(() => Promise.resolve(false)),
            findAccountsViolatingRule: jest.fn(() => Promise.resolve([])),
            wouldExceedGroupLimit: jest.fn(() => Promise.resolve(false)),
            getGroupsViolatedByAccountQuery: jest.fn(),
            find: jest.fn(() => Promise.resolve([])),
            getAccountsViolatingRuleQuery: jest.fn(),
        };
    }

    private roleClosureRepository(): Unit.Domain.RepositoryMocks.RoleClosure {
        return {
            existsTransitivePath: jest.fn(() => Promise.resolve(false)),
            decreaseTransitiveDepth: jest.fn(() => Promise.resolve()),
            insertNewHierarchy: jest.fn(() => Promise.resolve()),
            moveSubtrees: jest.fn(() =>
                Promise.resolve({
                    upsertedPaths: [],
                    removedPaths: [],
                }),
            ),
            move: jest.fn(() =>
                Promise.resolve({
                    upsertedPaths: [],
                    removedPaths: [],
                }),
            ),
        };
    }

    private permissionRepository(permissions: Entities.Permission[]): Unit.Domain.RepositoryMocks.Permission {
        return {
            ...this.baseRepository("Permission"),
            findUniqueOrThrow: jest.fn(() => Promise.resolve(permissions[0])),
            wouldExceedPermissionLimit: jest.fn(() => Promise.resolve(false)),
            find: jest.fn(() => Promise.resolve(permissions)),
            findAccountsByPermissions: jest.fn(),
            collectEffective: jest.fn(),
            getLookupList: jest.fn(),
            findEffective: jest.fn(),
        };
    }

    private realmRepository(realm: Entities.Realm): Unit.Domain.RepositoryMocks.Realm {
        return {
            ...this.baseRepository("Realm"),
            findUniqueOrThrow: jest.fn(() => Promise.resolve(realm)),
            wouldExceedRealmLimit: jest.fn(),
            getLookupList: jest.fn(),
        };
    }

    private roleRepository(roles: Entities.Role[]): Unit.Domain.RepositoryMocks.Role {
        return {
            ...this.baseRepository("Role"),
            findUniqueOrThrow: jest.fn(() => Promise.resolve(roles[0])),
            find: jest.fn(() => Promise.resolve(roles)),
            wouldExceedRoleLimit: jest.fn(),
            findAccountsByRoles: jest.fn(),
            getHierarchyGraph: jest.fn(),
            findDescendants: jest.fn(),
            getDescendants: jest.fn(),
            getLookupList: jest.fn(),
            findDelegable: jest.fn(),
            findEffective: jest.fn(),
            findAncestors: jest.fn(),
            getAncestors: jest.fn(),
        };
    }

    private auditLogRepository(): Unit.Domain.RepositoryMocks.AuditLog {
        return {
            ...this.baseRepository("AuditLog"),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private changeLogRepository(): Unit.Domain.RepositoryMocks.ChangeLog {
        return {
            ...this.baseRepository("ChangeLog"),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private baseRepository(resource: string): Unit.Domain.RepositoryMocks.Base {
        return {
            findUniqueOrThrow: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            find: jest.fn(),
            resource,
        };
    }
}
