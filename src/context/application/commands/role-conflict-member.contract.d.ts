declare namespace Commands.RoleConflictMember {
    interface Contract extends ControllerContract {}

    interface ControllerContract {
        create: Create.Signature;
        purge: Purge.Signature;
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

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
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

        type Signature = (props: Props) => Result;
    }
}
