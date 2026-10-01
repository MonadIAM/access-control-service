export * from "@monadiam/shared";

export enum MoveMode {
    /* eslint-disable prettier/prettier */
    PARALLEL = "PARALLEL",
    SUBTREE  = "SUBTREE",
    LINEAR   = "LINEAR",
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

export enum QueryMode {
    /* eslint-disable prettier/prettier */
    DEFAULT = "DEFAULT",
    MANAGE  = "MANAGE",
    /* eslint-enable prettier/prettier */
}

export enum ActionType {
    /* eslint-disable prettier/prettier */
    REPARENT = "REPARENT",
    RESTORE  = "RESTORE",
    EXCLUDE  = "EXCLUDE",
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

export enum CleanupJob {
    /* eslint-disable prettier/prettier */
    EXPIRED_ACCESS_RECORDS = "expire-access-records",
    CHANGE_LOG             = "cleanup-change-log",
    AUDIT_LOG              = "cleanup-audit-log",
    INBOX                  = "cleanup-inbox",
    /* eslint-enable prettier/prettier */
}
