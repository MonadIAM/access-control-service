declare namespace Operations {
    namespace RoleDelegationPolicy {
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
            context: RequestContext;
            input: {
                delegator: string;
                target: string;
                depthLimit?: number;
                description: string;
            };
        };

        type Update = {
            id: string;
            actor: string;
            realm: string;
            context: RequestContext;
            input: {
                patch: Partial<Entities.RoleDelegationPolicy.MutableFields>;
                reason: string;
            };
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
