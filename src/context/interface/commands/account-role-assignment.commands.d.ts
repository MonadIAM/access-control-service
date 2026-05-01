declare namespace Commands {
    namespace AccountRoleAssignment {
        interface ControllerContract {
            restore: (props: Restore.Props) => Promise<Restore.Result>;
            create: (props: Create.Props) => Promise<Create.Result>;
            revoke: (props: Revoke.Props) => Promise<Revoke.Result>;
            purge: (props: Purge.Props) => Promise<Purge.Result>;
        }

        interface ConsumerContract {
            assign: (props: Assign.Props) => Promise<Assign.Result>;
            clean: (props: Clean.Props) => Promise<Clean.Result>;
        }

        interface Contract extends ControllerContract, ConsumerContract {}

        namespace Create {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    account: string;
                    roles: string[];
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

        namespace Revoke {
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

        namespace Restore {
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

        namespace Assign {
            type Props = {
                account: string;
            };

            type Result = void;
        }

        namespace Clean {
            type Props = {
                account: string;
            };

            type Result = void;
        }
    }
}
