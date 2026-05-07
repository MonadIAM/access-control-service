export class RoleCreatedEvent {
    public static TOKEN = "role.created" as const;
    public constructor(
        public readonly role: string,
        public readonly realm: string,
        public readonly parent: string,
    ) {}
}

export class RoleUpdatedEvent {
    public static TOKEN = "role.updated" as const;
    public constructor(
        public readonly role: string,
        public readonly realm: string,
    ) {}
}

export class RolePurgedEvent {
    public static TOKEN = "role.purged";
    public constructor(
        public readonly role: string,
        public readonly realm: string,
    ) {}
}

export class RoleSubtreePurgedEvent {
    public static TOKEN = "role.subtree-purged" as const;
    public constructor(
        public readonly role: string,
        public readonly realm: string,
        public readonly count: number,
    ) {}
}

export class RoleRevokedEvent {
    public static TOKEN = "role.revoked" as const;
    public constructor(
        public readonly roles: string[],
        public readonly realm: string,
        public readonly affectedAccounts: string[],
    ) {}
}

export class RoleRestoredEvent {
    public static TOKEN = "role.restored" as const;
    public constructor(
        public readonly roles: string[],
        public readonly realm: string,
        public readonly affectedAccounts: string[],
    ) {}
}

export class RoleMovedEvent {
    public static TOKEN = "role.moveed" as const;
    public constructor(
        public readonly roles: string[],
        public readonly realm: string,
    ) {}
}
