declare namespace Commands {
    namespace RolePermissionAssignment {
        interface Contract {
            restore: (props: Restore.Props) => Promise<Restore.Result>;
            create: (props: Create.Props) => Promise<Create.Result>;
            revoke: (props: Revoke.Props) => Promise<Revoke.Result>;
            purge: (props: Purge.Props) => Promise<Purge.Result>;
        }

        namespace Create {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    permissions: string[];
                    role: string;
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
