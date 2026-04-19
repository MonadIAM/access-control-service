declare namespace Commands {
    namespace RoleConflictMember {
        interface Contract {
            create: (props: Create.Props) => Promise<Create.Result>;
            purge: (props: Purge.Props) => Promise<Purge.Result>;
        }

        namespace Create {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    roles: string[];
                    group: string;
                };
                context: Extract.Meta;
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
                context: Extract.Meta;
            };

            type Result = MessageResult;
        }
    }
}
