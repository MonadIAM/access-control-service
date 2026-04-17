declare namespace Commands {
    namespace RoleDelegationPolicy {
        interface Contract {
            restore: (props: Restore.Props) => Promise<Restore.Result>;
            create: (props: Create.Props) => Promise<Create.Result>;
            update: (props: Update.Props) => Promise<Update.Result>;
            revoke: (props: Revoke.Props) => Promise<Revoke.Result>;
            purge: (props: Purge.Props) => Promise<Purge.Result>;
        }

        namespace Create {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    delegator: string;
                    target: string;
                    depthLimit?: number;
                    description: string;
                };
                context: RequestContext;
            };

            type Result = MessageResult;
        }

        namespace Update {
            type Props = {
                id: string;
                actor: string;
                realm: string;
                input: {
                    patch: Partial<Entities.RoleDelegationPolicy.MutableFields>;
                    reason: string;
                };
                context: RequestContext;
            };

            type Result = MessageResult;
        }

        namespace Purge {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: RequestContext;
            };

            type Result = MessageResult;
        }
        namespace Revoke {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: RequestContext;
            };

            type Result = MessageResult;
        }

        namespace Restore {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: RequestContext;
            };

            type Result = MessageResult;
        }
    }
}
