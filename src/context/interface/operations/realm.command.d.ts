declare namespace Commands {
    namespace Realm {
        interface Contract {
            create: (props: Create) => Promise<MessageResult>;
            update: (props: Update) => Promise<MessageResult>;
            purge: (props: Purge) => Promise<MessageResult>;
            revoke: (props: Revoke) => Promise<MessageResult>;
            restore: (props: Restore) => Promise<MessageResult>;
        }

        type Create = {
            actor: string;
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
            input: {
                patch: Partial<Entities.Realm.MutableFields>;
                reason: string;
            };
            context: RequestContext;
        };

        type Purge = {
            actor: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: RequestContext;
        };

        type Revoke = {
            actor: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: RequestContext;
        };

        type Restore = {
            actor: string;
            input: {
                identifiers: string[];
                reason: string;
            };
            context: RequestContext;
        };
    }
}
