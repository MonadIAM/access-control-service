declare namespace Commands {
    namespace AccountRoleAssignment {
        interface Contract extends ControllerContract, ConsumerContract {}

        interface ConsumerContract {
            assign: Assign.Signature;
            clean: Clean.Signature;
        }

        namespace Assign {
            type Props = {
                account: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Clean {
            type Props = {
                account: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        interface ControllerContract {
            restore: Restore.Signature;
            create: Create.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
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

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

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

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
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
}
