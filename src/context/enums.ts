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
