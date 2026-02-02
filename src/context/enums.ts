export enum RoleActorType {
    service = "SERVICE",
    system = "SYSTEM",
    human = "HUMAN",
}

export enum RoleProtoType {
    COMPOSITE = "COMPOSITE",
    ATOMIC = "ATOMIC",
}

export enum PermissionOverrideEffect {
    ALLOW = "allow",
    DENY = "deny",
}

export enum AccessControlEntityType {
    PERMISSION_ASSIGNMENT = "permission_assignment",
    PERMISSION_OVERRIDE = "permission_override",
    DELEGATION_POLICY = "delegation_policy",
    ROLE_ASSIGNMENT = "role_assignment",
    CONFLICT_MEMBER = "conflict_member",
    CONFLICT_GROUP = "conflict_group",
    PERMISSION = "permission",
    REALM = "realm",
    ROLE = "role",
}

export enum AccessControlActionType {
    RESTORE = "restore",
    REVOKE = "revoke",
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
}
