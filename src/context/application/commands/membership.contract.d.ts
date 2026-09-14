declare namespace Commands {
    namespace Membership {
        interface Contract extends InternalContract, ConsumerContract {}

        interface InternalContract {
            rejectLeave: RejectLeave.Signature;
            rejectJoin: RejectJoin.Signature;
        }

        interface ConsumerContract {
            leave: Leave.Signature;
            join: Join.Signature;
        }

        namespace RejectJoin {
            type Props = {
                request: Topics.Membership.JoinRequestedMessage["payload"];
                incoming: TransactionManager.Service.IncomingMessage;
                reason: string;
            };

            type ExecuteResult = Omit<Props, "incoming">;

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RejectLeave {
            type Props = {
                request: Topics.Membership.LeaveRequestedMessage["payload"];
                incoming: TransactionManager.Service.IncomingMessage;
                reason: string;
            };

            type ExecuteResult = Omit<Props, "incoming">;

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Join {
            type Props = {
                input: Topics.Membership.JoinRequestedMessage["payload"]["input"];
                incoming: TransactionManager.Service.IncomingMessage;
                actor: string;
                realm: string;
            };

            type ExecuteResult = {
                request: Topics.Membership.JoinRequestedMessage["payload"]["input"];
                assignments: Entities.AccountRoleAssignment[];
                actor: string;
                realm: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Leave {
            type Props = {
                input: Topics.Membership.LeaveRequestedMessage["payload"]["input"];
                incoming: TransactionManager.Service.IncomingMessage;
                actor: string;
                realm: string;
            };

            type ExecuteResult = {
                request: Topics.Membership.LeaveRequestedMessage["payload"]["input"];
                assignments: Entities.AccountRoleAssignment[];
                overrides: Entities.PermissionOverride[];
                realmEntity: Entities.Realm;
                actor: string;
                realm: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
