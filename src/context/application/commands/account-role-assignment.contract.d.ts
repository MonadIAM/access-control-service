declare namespace Commands.AccountRoleAssignment {
    interface Contract extends ControllerContract, ConsumerContract, ProcessorContract, InternalContract {}

    interface InternalContract {
        rejectJoin: RejectJoin.Signature;
    }

    namespace RejectJoin {
        type Props = {
            request: Topics.Realm.MembershipJoinRequestedMessage["payload"];
            incoming: TransactionManager.Service.IncomingMessage;
            reason: string;
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    interface ProcessorContract {
        expire: Expire.Signature;
    }

    namespace Expire {
        type Props = {
            batchSize: number;
            now?: Date;
        };

        type Result = Promise<number>;

        type Signature = (props: Props) => Result;
    }

    interface ConsumerContract {
        assign: Assign.Signature;
        clean: Clean.Signature;
        join: Join.Signature;
    }

    namespace Join {
        type Props = {
            input: Topics.Realm.MembershipJoinRequestedMessage["payload"]["input"];
            incoming: TransactionManager.Service.IncomingMessage;
            actor: string;
            realm: string;
        };

        type ExecuteResult = {
            request: Topics.Realm.MembershipJoinRequestedMessage["payload"]["input"];
            assignments: Entities.AccountRoleAssignment[];
            actor: string;
            realm: string;
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    namespace Assign {
        type Props = {
            incoming: TransactionManager.Service.IncomingMessage;
            account: string;
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    namespace Clean {
        type Props = {
            incoming: TransactionManager.Service.IncomingMessage;
            account: string;
        };

        type ExecuteResult = {
            assignments: Entities.AccountRoleAssignment[];
            overrides: Entities.PermissionOverride[];
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
                justification: string;
                expiresAt?: Date;
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
