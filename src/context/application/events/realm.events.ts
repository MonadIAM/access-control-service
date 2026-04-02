export class RealmCreatedEvent {
    public static TOKEN = "realm.created" as const;
    public constructor(
        public readonly realm: string,
        public readonly actor: string,
    ) {}
}

export class RealmUpdatedEvent {
    public static TOKEN = "realm.updated" as const;
    public constructor(public readonly realm: string) {}
}

export class RealmPurgedEvent {
    public static TOKEN = "realm.purged" as const;
    public constructor(public readonly realms: string[]) {}
}

export class RealmRevokedEvent {
    public static TOKEN = "realm.revoked" as const;
    public constructor(public readonly realms: string[]) {}
}

export class RealmRestoredEvent {
    public static TOKEN = "realm.restored" as const;
    public constructor(public readonly realms: string[]) {}
}
