declare namespace Commands {
    namespace RoleConflictMember {
        interface ControllerContract {
            create: (props: Create.Props) => Create.Result;
            purge: (props: Purge.Props) => Purge.Result;
        }

        interface Contract extends ControllerContract {}

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

            type Result = Promise<MessageResult>;
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

            type Result = Promise<MessageResult>;
        }
    }
}
