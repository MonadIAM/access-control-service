declare namespace Commands {
    namespace RoleConflictMember {
        interface Contract {
            create: (props: Create) => Promise<MessageResult>;
            purge: (props: Purge) => Promise<MessageResult>;
        }

        type Create = {
            actor: string;
            realm: string;
            input: {
                roles: string[];
                group: string;
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
    }
}
