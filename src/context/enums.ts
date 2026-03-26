export enum RoleActorType {
    /* eslint-disable prettier/prettier */
    SERVICE = "SERVICE",
    SYSTEM  = "SYSTEM",
    HUMAN   = "HUMAN",
    /* eslint-enable prettier/prettier */
}

export enum RoleProtoType {
    /* eslint-disable prettier/prettier */
    COMPOSITE = "COMPOSITE",
    ATOMIC    = "ATOMIC",
    /* eslint-enable prettier/prettier */
}

export enum PermissionOverrideEffect {
    /* eslint-disable prettier/prettier */
    ALLOW = "ALLOW",
    DENY  = "DENY",
    /* eslint-enable prettier/prettier */
}

export enum AccessControlEntityType {
    /* eslint-disable prettier/prettier */
    PERMISSION_ASSIGNMENT = "PERMISSION_ASSIGNMENT",
    PERMISSION_OVERRIDE   = "PERMISSION_OVERRIDE",
    DELEGATION_POLICY     = "DELEGATION_POLICY",
    ROLE_ASSIGNMENT       = "ROLE_ASSIGNMENT",
    CONFLICT_MEMBER       = "CONFLICT_MEMBER",
    CONFLICT_GROUP        = "CONFLICT_GROUP",
    PERMISSION            = "PERMISSION",
    REALM                 = "REALM",
    ROLE                  = "ROLE",
    /* eslint-enable prettier/prettier */
}

export enum AccessControlActionType {
    /* eslint-disable prettier/prettier */
    RESTORE = "RESTORE",
    REVOKE  = "REVOKE",
    CREATE  = "CREATE",
    UPDATE  = "UPDATE",
    DELETE  = "DELETE",
    /* eslint-enable prettier/prettier */
}

export enum DelegatorType {
    /* eslint-disable prettier/prettier */
    ACCOUNT = "ACCOUNT",
    ROLE    = "ROLE",
    /* eslint-enable prettier/prettier */
}

export enum ResponseViewType {
    /* eslint-disable prettier/prettier */
    DETAILED = "DETAILED",
    COMPACT  = "COMPACT",
    /* eslint-enable prettier/prettier */
}

export enum AssignmentScope {
    /* eslint-disable prettier/prettier */
    REALM  = "REALM",
    GLOBAL = "GLOBAL",
    /* eslint-enable prettier/prettier */
}

export enum PermissionCode {
    /* eslint-disable prettier/prettier */
    REALM_READ_OWN = "realm.read_own",
    REALM_READ_ALL = "realm.read_all",
    REALM_CREATE   = "realm.create",
    REALM_UPDATE   = "realm.update",
    REALM_REVOKE   = "realm.revoke",
    REALM_RESTORE  = "realm.restore",
    REALM_PURGE    = "realm.purge",

    ROLE_READ_OWN      = "role.read_own",
    ROLE_READ_ALL      = "role.read_all",
    ROLE_CREATE        = "role.create",
    ROLE_UPDATE        = "role.update",
    ROLE_REVOKE        = "role.revoke",
    ROLE_RESTORE       = "role.restore",
    ROLE_PURGE         = "role.purge",
    ROLE_PURGE_SUBTREE = "role.purge_subtree",

    PERMISSION_READ_OWN = "permission.read_own",
    PERMISSION_READ_ALL = "permission.read_all",
    PERMISSION_CREATE   = "permission.create",
    PERMISSION_UPDATE   = "permission.update",
    PERMISSION_REVOKE   = "permission.revoke",
    PERMISSION_RESTORE  = "permission.restore",
    PERMISSION_PURGE    = "permission.purge",

    ROLE_PERMISSION_ASSIGNMENT_READ_OWN = "role_permission_assignment.read_own",
    ROLE_PERMISSION_ASSIGNMENT_READ_ALL = "role_permission_assignment.read_all",
    ROLE_PERMISSION_ASSIGNMENT_CREATE   = "role_permission_assignment.create",
    ROLE_PERMISSION_ASSIGNMENT_REVOKE   = "role_permission_assignment.revoke",
    ROLE_PERMISSION_ASSIGNMENT_RESTORE  = "role_permission_assignment.restore",
    ROLE_PERMISSION_ASSIGNMENT_PURGE    = "role_permission_assignment.purge",

    ACCOUNT_ROLE_ASSIGNMENT_READ_OWN = "account_role_assignment.read_own",
    ACCOUNT_ROLE_ASSIGNMENT_READ_ALL = "account_role_assignment.read_all",
    ACCOUNT_ROLE_ASSIGNMENT_CREATE   = "account_role_assignment.create",
    ACCOUNT_ROLE_ASSIGNMENT_REVOKE   = "account_role_assignment.revoke",
    ACCOUNT_ROLE_ASSIGNMENT_RESTORE  = "account_role_assignment.restore",
    ACCOUNT_ROLE_ASSIGNMENT_PURGE    = "account_role_assignment.purge",

    PERMISSION_OVERRIDE_READ_OWN = "permission_override.read_own",
    PERMISSION_OVERRIDE_READ_ALL = "permission_override.read_all",
    PERMISSION_OVERRIDE_CREATE   = "permission_override.create",
    PERMISSION_OVERRIDE_REVOKE   = "permission_override.revoke",
    PERMISSION_OVERRIDE_RESTORE  = "permission_override.restore",
    PERMISSION_OVERRIDE_PURGE    = "permission_override.purge",

    ROLE_DELEGATION_POLICY_READ_OWN = "role_delegation_policy.read_own",
    ROLE_DELEGATION_POLICY_READ_ALL = "role_delegation_policy.read_all",
    ROLE_DELEGATION_POLICY_CREATE   = "role_delegation_policy.create",
    ROLE_DELEGATION_POLICY_UPDATE   = "role_delegation_policy.update",
    ROLE_DELEGATION_POLICY_REVOKE   = "role_delegation_policy.revoke",
    ROLE_DELEGATION_POLICY_RESTORE  = "role_delegation_policy.restore",
    ROLE_DELEGATION_POLICY_PURGE    = "role_delegation_policy.purge",

    ROLE_CONFLICT_GROUP_READ_OWN = "role_conflict_group.read_own",
    ROLE_CONFLICT_GROUP_READ_ALL = "role_conflict_group.read_all",
    ROLE_CONFLICT_GROUP_CREATE   = "role_conflict_group.create",
    ROLE_CONFLICT_GROUP_UPDATE   = "role_conflict_group.update",
    ROLE_CONFLICT_GROUP_REVOKE   = "role_conflict_group.revoke",
    ROLE_CONFLICT_GROUP_RESTORE  = "role_conflict_group.restore",
    ROLE_CONFLICT_GROUP_PURGE    = "role_conflict_group.purge",

    ROLE_CONFLICT_MEMBER_READ_OWN = "role_conflict_member.read_own",
    ROLE_CONFLICT_MEMBER_READ_ALL = "role_conflict_member.read_all",
    ROLE_CONFLICT_MEMBER_CREATE   = "role_conflict_member.create",
    ROLE_CONFLICT_MEMBER_PURGE    = "role_conflict_member.purge",

    AUDIT_LOG_READ  = "audit_log.read",
    CHANGE_LOG_READ = "change_log.read",
    /* eslint-enable prettier/prettier */
}
