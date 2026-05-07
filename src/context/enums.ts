export * from "@liam/contracts";

export enum MoveMode {
    PARALLEL = "PARALLEL",
    SUBTREE = "SUBTREE",
    LINEAR = "LINEAR",
}

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

export enum EntityType {
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

export const AggregateType = EntityType;
export type AggregateType = EntityType;

export enum EventType {
    /* eslint-disable prettier/prettier */
    REPARENT = "REPARENT",
    RESTORE  = "RESTORE",
    REVOKE   = "REVOKE",
    CREATE   = "CREATE",
    UPDATE   = "UPDATE",
    DELETE   = "DELETE",
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
    REALM_READ_PERSONAL = "realm.read_personal",
    REALM_READ_ABSOLUTE = "realm.read_absolute",
    REALM_CREATE        = "realm.create",
    REALM_UPDATE        = "realm.update",
    REALM_REVOKE        = "realm.revoke",
    REALM_RESTORE       = "realm.restore",
    REALM_PURGE         = "realm.purge",

    ROLE_READ_COMMON      = "role.read_common",
    ROLE_READ_PERSONAL    = "role.read_personal",
    ROLE_READ_ABSOLUTE    = "role.read_absolute",
    ROLE_CREATE           = "role.create",
    ROLE_UPDATE           = "role.update",
    ROLE_REVOKE           = "role.revoke",
    ROLE_RESTORE          = "role.restore",
    ROLE_PURGE            = "role.purge",
    ROLE_PURGE_SUBTREE    = "role.purge_subtree",
    ROLE_HIERARCHY_UPDATE = "role.hierarchy_update",

    PERMISSION_READ_COMMON   = "permission.read_common",
    PERMISSION_READ_PERSONAL = "permission.read_personal",
    PERMISSION_READ_ABSOLUTE = "permission.read_absolute",
    PERMISSION_CREATE        = "permission.create",
    PERMISSION_UPDATE        = "permission.update",
    PERMISSION_REVOKE        = "permission.revoke",
    PERMISSION_RESTORE       = "permission.restore",
    PERMISSION_PURGE         = "permission.purge",

    ROLE_PERMISSION_ASSIGNMENT_READ_COMMON = "role_permission_assignment.read_common",
    ROLE_PERMISSION_ASSIGNMENT_CREATE      = "role_permission_assignment.create",
    ROLE_PERMISSION_ASSIGNMENT_REVOKE      = "role_permission_assignment.revoke",
    ROLE_PERMISSION_ASSIGNMENT_RESTORE     = "role_permission_assignment.restore",
    ROLE_PERMISSION_ASSIGNMENT_PURGE       = "role_permission_assignment.purge",

    ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON = "account_role_assignment.read_common",
    ACCOUNT_ROLE_ASSIGNMENT_CREATE      = "account_role_assignment.create",
    ACCOUNT_ROLE_ASSIGNMENT_REVOKE      = "account_role_assignment.revoke",
    ACCOUNT_ROLE_ASSIGNMENT_RESTORE     = "account_role_assignment.restore",
    ACCOUNT_ROLE_ASSIGNMENT_PURGE       = "account_role_assignment.purge",

    PERMISSION_OVERRIDE_READ_PERSONAL = "permission_override.read_personal",
    PERMISSION_OVERRIDE_READ_ABSOLUTE = "permission_override.read_absolute",
    PERMISSION_OVERRIDE_CREATE        = "permission_override.create",
    PERMISSION_OVERRIDE_REVOKE        = "permission_override.revoke",
    PERMISSION_OVERRIDE_RESTORE       = "permission_override.restore",
    PERMISSION_OVERRIDE_PURGE         = "permission_override.purge",

    ROLE_DELEGATION_POLICY_READ_COMMON = "role_delegation_policy.read_common",
    ROLE_DELEGATION_POLICY_CREATE      = "role_delegation_policy.create",
    ROLE_DELEGATION_POLICY_UPDATE      = "role_delegation_policy.update",
    ROLE_DELEGATION_POLICY_REVOKE      = "role_delegation_policy.revoke",
    ROLE_DELEGATION_POLICY_RESTORE     = "role_delegation_policy.restore",
    ROLE_DELEGATION_POLICY_PURGE       = "role_delegation_policy.purge",

    ROLE_CONFLICT_GROUP_READ_ABSOLUTE = "role_conflict_group.read_absolute",
    ROLE_CONFLICT_GROUP_CREATE        = "role_conflict_group.create",
    ROLE_CONFLICT_GROUP_UPDATE        = "role_conflict_group.update",
    ROLE_CONFLICT_GROUP_REVOKE        = "role_conflict_group.revoke",
    ROLE_CONFLICT_GROUP_RESTORE       = "role_conflict_group.restore",
    ROLE_CONFLICT_GROUP_PURGE         = "role_conflict_group.purge",

    ROLE_CONFLICT_MEMBER_READ_ABSOLUTE = "role_conflict_member.read_absolute",
    ROLE_CONFLICT_MEMBER_CREATE        = "role_conflict_member.create",
    ROLE_CONFLICT_MEMBER_PURGE         = "role_conflict_member.purge",

    AUDIT_LOG_READ_ABSOLUTE  = "audit_log.read_absolute",
    CHANGE_LOG_READ_ABSOLUTE = "change_log.read_absolute",
    /* eslint-enable prettier/prettier */
}
