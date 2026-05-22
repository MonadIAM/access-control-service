export * from "@liam/contracts";

export enum MoveMode {
    /* eslint-disable prettier/prettier */
    PARALLEL = "PARALLEL",
    SUBTREE  = "SUBTREE",
    LINEAR   = "LINEAR",
    /* eslint-enable prettier/prettier */
}

export enum RoleActorType {
    /* eslint-disable prettier/prettier */
    SERVICE = "SERVICE",
    SYSTEM  = "SYSTEM",
    HUMAN   = "HUMAN",
    /* eslint-enable prettier/prettier */
}

export enum RolePrototype {
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

export enum ProjectionJournalStatus {
    /* eslint-disable prettier/prettier */
    PROCESSING = "PROCESSING",
    PENDING    = "PENDING",
    APPLIED    = "APPLIED",
    FAILED     = "FAILED",
    DEAD       = "DEAD",
    /* eslint-enable prettier/prettier */
}
