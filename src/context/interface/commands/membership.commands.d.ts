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
                reason: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RejectLeave {
            type Props = {
                request: Topics.Membership.LeaveRequestedMessage["payload"];
                reason: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Join {
            type Props = {
                input: Topics.Membership.JoinRequestedMessage["payload"];
            };

            type ExecuteResult = {
                request: Topics.Membership.JoinRequestedMessage["payload"];
                assignments: Entities.AccountRoleAssignment[];
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Leave {
            type Props = {
                input: Topics.Membership.LeaveRequestedMessage["payload"];
            };

            type ExecuteResult = {
                request: Topics.Membership.LeaveRequestedMessage["payload"];
                assignments: Entities.AccountRoleAssignment[];
                overrides: Entities.PermissionOverride[];
                realm: Entities.Realm;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
