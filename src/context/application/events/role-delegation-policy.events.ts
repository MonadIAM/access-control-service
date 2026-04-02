export class RoleDelegationPolicyCreatedEvent {
    public static TOKEN = "role-delegation-policy.created" as const;
    public constructor(
        public readonly realm: string,
        public readonly delegator: string,
        public readonly target: string,
    ) {}
}

export class RoleDelegationPolicyUpdatedEvent {
    public static TOKEN = "role-delegation-policy.updated" as const;
    public constructor(
        public readonly policy: string,
        public readonly realm: string,
    ) {}
}

export class RoleDelegationPolicyPurgedEvent {
    public static TOKEN = "role-delegation-policy.purged" as const;
    public constructor(public readonly policies: string[]) {}
}

export class RoleDelegationPolicyRevokedEvent {
    public static TOKEN = "role-delegation-policy.revoked" as const;
    public constructor(public readonly policies: string[]) {}
}

export class RoleDelegationPolicyRestoredEvent {
    public static TOKEN = "role-delegation-policy.restored" as const;
    public constructor(public readonly policies: string[]) {}
}
