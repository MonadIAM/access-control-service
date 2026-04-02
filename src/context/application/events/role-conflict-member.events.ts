export class RoleConflictMemberCreatedEvent {
    public static TOKEN = "role-conflict-member.created" as const;
    public constructor(
        public readonly group: string,
        public readonly realm: string,
        public readonly roles: string[],
    ) {}
}

export class RoleConflictMemberPurgedEvent {
    public static TOKEN = "role-conflict-member.purged" as const;
    public constructor(public readonly members: string[]) {}
}
