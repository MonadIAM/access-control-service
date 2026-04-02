export class PermissionOverrideCreatedEvent {
    public static TOKEN = "permission-override.created" as const;
    public constructor(
        public readonly realm: string,
        public readonly permission: string,
        public readonly account: string,
        public readonly affectedAccounts: string[],
    ) {}
}

export class PermissionOverridePurgedEvent {
    public static TOKEN = "permission-override.purged" as const;
    public constructor(public readonly overrides: string[]) {}
}

export class PermissionOverrideRevokedEvent {
    public static TOKEN = "permission-override.revoked" as const;
    public constructor(
        public readonly overrides: string[],
        public readonly affectedAccounts: string[],
    ) {}
}

export class PermissionOverrideRestoredEvent {
    public static TOKEN = "permission-override.restored" as const;
    public constructor(
        public readonly overrides: string[],
        public readonly affectedAccounts: string[],
    ) {}
}
