declare namespace Operations {
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
            context: RequestContext;
            input: {
                code: string;
                name: string;
                description?: string;
            };
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
