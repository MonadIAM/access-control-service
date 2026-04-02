export class RolePermissionAssignmentCreatedEvent {
    public static TOKEN = "role-permission-assignment.created" as const;
    public constructor(
        public readonly role: string,
        public readonly realm: string,
        public readonly permissions: string[],
        public readonly affectedAccounts: string[],
    ) {}
}

export class RolePermissionAssignmentPurgedEvent {
    public static TOKEN = "role-permission-assignment.purged" as const;
    public constructor(public readonly assignments: string[]) {}
}

export class RolePermissionAssignmentRevokedEvent {
    public static TOKEN = "role-permission-assignment.revoked" as const;
    public constructor(
        public readonly assignments: string[],
        public readonly affectedAccounts: string[],
    ) {}
}

export class RolePermissionAssignmentRestoredEvent {
    public static TOKEN = "role-permission-assignment.restored" as const;
    public constructor(
        public readonly assignments: string[],
        public readonly affectedAccounts: string[],
    ) {}
}
