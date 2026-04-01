declare namespace Commands {
    namespace Permission {
        interface Contract {
            create: (props: Create) => Promise<MessageResult>;
            update: (props: Update) => Promise<MessageResult>;
            purge: (props: Purge) => Promise<MessageResult>;
            revoke: (props: Revoke) => Promise<MessageResult>;
            restore: (props: Restore) => Promise<MessageResult>;
        }

        type Create = {
            actor: string;
            realm: string;
            input: {
                code: string;
                name: string;
                description?: string;
            };
            context: RequestContext;
        };

        type Update = {
            id: string;
            actor: string;
            realm: string;
            input: {
                patch: Partial<Entities.Permission.MutableFields>;
                reason: string;
            };
            context: RequestContext;
        };

        type Purge = {
            actor: string;
            realm: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: RequestContext;
        };

        type Revoke = {
            actor: string;
            realm: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: RequestContext;
        };

        type Restore = {
            actor: string;
            realm: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: RequestContext;
        };
    }
}
