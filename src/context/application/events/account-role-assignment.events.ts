export class AccountRoleAssignmentCreatedEvent {
    public static TOKEN = "account-role-assignment.created" as const;
    public constructor(
        public readonly account: string,
        public readonly realm: string,
        public readonly roles: string[],
        public readonly affectedAccounts: string[],
    ) {}
}

export class AccountRoleAssignmentPurgedEvent {
    public static TOKEN = "account-role-assignment.purged" as const;
    public constructor(public readonly assignments: string[]) {}
}

export class AccountRoleAssignmentRevokedEvent {
    public static TOKEN = "account-role-assignment.revoked" as const;
    public constructor(
        public readonly assignments: string[],
        public readonly affectedAccounts: string[],
    ) {}
}

export class AccountRoleAssignmentRestoredEvent {
    public static TOKEN = "account-role-assignment.restored" as const;
    public constructor(
        public readonly assignments: string[],
        public readonly affectedAccounts: string[],
    ) {}
}
