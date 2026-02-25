export enum RoleActorType {
    SERVICE = "SERVICE",
    SYSTEM = "SYSTEM",
    HUMAN = "HUMAN",
}

export enum RoleProtoType {
    COMPOSITE = "COMPOSITE",
    ATOMIC = "ATOMIC",
}

export enum PermissionOverrideEffect {
    ALLOW = "ALLOW",
    DENY = "DENY",
}

export enum AccessControlEntityType {
    PERMISSION_ASSIGNMENT = "PERMISSION_ASSIGNMENT",
    PERMISSION_OVERRIDE = "PERMISSION_OVERRIDE",
    DELEGATION_POLICY = "DELEGATION_POLICY",
    ROLE_ASSIGNMENT = "ROLE_ASSIGNMENT",
    CONFLICT_MEMBER = "CONFLICT_MEMBER",
    CONFLICT_GROUP = "CONFLICT_GROUP",
    PERMISSION = "PERMISSION",
    REALM = "REALM",
    ROLE = "ROLE",
}

export enum AccessControlActionType {
    RESTORE = "RESTORE",
    REVOKE = "REVOKE",
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
}

export enum DelegatorType {
    ACCOUNT = "ACCOUNT",
    ROLE = "ROLE",
}

export enum ResponseViewType {
    DETAILED = "DETAILED",
    COMPACT = "COMPACT",
}

export enum AssignmentScope {
    REALM = "REALM",
    GLOBAL = "GLOBAL",
}

export enum PermissionCode {
    REALM_READ = "realm:read",
    REALM_CREATE = "realm:create",
    REALM_UPDATE = "realm:update",
    REALM_REVOKE = "realm:revoke",
    REALM_RESTORE = "realm:restore",
    REALM_PURGE = "realm:purge",

    ROLE_READ = "role:read",
    ROLE_CREATE = "role:create",
    ROLE_UPDATE = "role:update",
    ROLE_REVOKE = "role:revoke",
    ROLE_RESTORE = "role:restore",
    ROLE_PURGE = "role:purge",
    ROLE_PURGE_SUBTREE = "role:purge-subtree",

    PERMISSION_READ = "permission:read",
    PERMISSION_CREATE = "permission:create",
    PERMISSION_UPDATE = "permission:update",
    PERMISSION_REVOKE = "permission:revoke",
    PERMISSION_RESTORE = "permission:restore",
    PERMISSION_PURGE = "permission:purge",

    ROLE_PERMISSION_ASSIGNMENT_READ = "role-permission-assignment:read",
    ROLE_PERMISSION_ASSIGNMENT_CREATE = "role-permission-assignment:create",
    ROLE_PERMISSION_ASSIGNMENT_REVOKE = "role-permission-assignment:revoke",
    ROLE_PERMISSION_ASSIGNMENT_RESTORE = "role-permission-assignment:restore",
    ROLE_PERMISSION_ASSIGNMENT_PURGE = "role-permission-assignment:purge",

    ACCOUNT_ROLE_ASSIGNMENT_READ = "account-role-assignment:read",
    ACCOUNT_ROLE_ASSIGNMENT_CREATE = "account-role-assignment:create",
    ACCOUNT_ROLE_ASSIGNMENT_REVOKE = "account-role-assignment:revoke",
    ACCOUNT_ROLE_ASSIGNMENT_RESTORE = "account-role-assignment:restore",
    ACCOUNT_ROLE_ASSIGNMENT_PURGE = "account-role-assignment:purge",

    PERMISSION_OVERRIDE_READ = "permission-override:read",
    PERMISSION_OVERRIDE_CREATE = "permission-override:create",
    PERMISSION_OVERRIDE_REVOKE = "permission-override:revoke",
    PERMISSION_OVERRIDE_RESTORE = "permission-override:restore",
    PERMISSION_OVERRIDE_PURGE = "permission-override:purge",

    ROLE_DELEGATION_POLICY_READ = "role-delegation-policy:read",
    ROLE_DELEGATION_POLICY_CREATE = "role-delegation-policy:create",
    ROLE_DELEGATION_POLICY_UPDATE = "role-delegation-policy:update",
    ROLE_DELEGATION_POLICY_REVOKE = "role-delegation-policy:revoke",
    ROLE_DELEGATION_POLICY_RESTORE = "role-delegation-policy:restore",
    ROLE_DELEGATION_POLICY_PURGE = "role-delegation-policy:purge",

    ROLE_CONFLICT_GROUP_READ = "role-conflict-group:read",
    ROLE_CONFLICT_GROUP_CREATE = "role-conflict-group:create",
    ROLE_CONFLICT_GROUP_UPDATE = "role-conflict-group:update",
    ROLE_CONFLICT_GROUP_REVOKE = "role-conflict-group:revoke",
    ROLE_CONFLICT_GROUP_RESTORE = "role-conflict-group:restore",
    ROLE_CONFLICT_GROUP_PURGE = "role-conflict-group:purge",

    ROLE_CONFLICT_MEMBER_READ = "role-conflict-member:read",
    ROLE_CONFLICT_MEMBER_CREATE = "role-conflict-member:create",
    ROLE_CONFLICT_MEMBER_PURGE = "role-conflict-member:purge",

    AUDIT_JOURNAL_READ = "audit-journal:read",
}
