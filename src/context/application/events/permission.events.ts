export class PermissionCreatedEvent {
    public static TOKEN = "permission.created" as const;
    public constructor(
        public readonly permission: string,
        public readonly realm: string,
    ) {}
}

export class PermissionUpdatedEvent {
    public static TOKEN = "permission.updated" as const;
    public constructor(
        public readonly permission: string,
        public readonly realm: string,
    ) {}
}

export class PermissionPurgedEvent {
    public static TOKEN = "permission.purged" as const;
    public constructor(
        public readonly permissions: string[],
        public readonly realm: string,
    ) {}
}

export class PermissionRevokedEvent {
    public static TOKEN = "permission.revoked" as const;
    public constructor(
        public readonly permissions: string[],
        public readonly realm: string,
        public readonly affectedAccounts: string[],
    ) {}
}

export class PermissionRestoredEvent {
    public static TOKEN = "permission.restored" as const;
    public constructor(
        public readonly permissions: string[],
        public readonly realm: string,
        public readonly affectedAccounts: string[],
    ) {}
}
