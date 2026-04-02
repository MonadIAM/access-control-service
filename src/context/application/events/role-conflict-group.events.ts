export class RoleConflictGroupCreatedEvent {
    public static TOKEN = "role-conflict-group.created" as const;
    public constructor(
        public readonly realm: string,
        public readonly members: string[],
    ) {}
}

export class RoleConflictGroupUpdatedEvent {
    public static TOKEN = "role-conflict-group.updated" as const;
    public constructor(
        public readonly group: string,
        public readonly realm: string,
    ) {}
}

export class RoleConflictGroupPurgedEvent {
    public static TOKEN = "role-conflict-group.purged" as const;
    public constructor(public readonly groups: string[]) {}
}

export class RoleConflictGroupRevokedEvent {
    public static TOKEN = "role-conflict-group.revoked" as const;
    public constructor(public readonly groups: string[]) {}
}

export class RoleConflictGroupRestoredEvent {
    public static TOKEN = "role-conflict-group.restored" as const;
    public constructor(public readonly groups: string[]) {}
}
