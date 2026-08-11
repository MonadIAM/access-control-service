declare namespace Commands {
    namespace Mappers {
        namespace Membership {
            interface Contract extends PublicContract {}

            interface PublicContract {
                leaveAssignmentProjectionPayload: LeaveAssignmentProjectionPayload.Signature;
                joinAssignmentProjectionPayload: JoinAssignmentProjectionPayload.Signature;
                leaveOverrideProjectionPayload: LeaveOverrideProjectionPayload.Signature;
                leaveConfirmedPayload: LeaveConfirmedPayload.Signature;
                leaveRejectedPayload: LeaveRejectedPayload.Signature;
                joinConfirmedPayload: JoinConfirmedPayload.Signature;
                joinRejectedPayload: JoinRejectedPayload.Signature;
                leaveAccessCachePayload: LeaveAccessCachePayload.Signature;
                joinAccessCachePayload: JoinAccessCachePayload.Signature;
                notificationPayload: NotificationPayload.Signature;
            }

            namespace JoinAssignmentProjectionPayload {
                type Props = Commands.Membership.Join.ExecuteResult;

                type Result = Scripts.AccountRoleAssignment.Create.Props;

                type Signature = (props: Props) => Result;
            }

            namespace JoinAccessCachePayload {
                type Props = Commands.Membership.Join.ExecuteResult;

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace JoinConfirmedPayload {
                type Props = Commands.Membership.Join.ExecuteResult;

                type Result = Topics.Membership.JoinConfirmedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace JoinRejectedPayload {
                type Props = Commands.Membership.RejectJoin.Props;

                type Result = Topics.Membership.JoinRejectedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace LeaveAssignmentProjectionPayload {
                type Props = Commands.Membership.Leave.ExecuteResult;

                type Result = Scripts.AccountRoleAssignment.Purge.Props;

                type Signature = (props: Props) => Result;
            }

            namespace LeaveOverrideProjectionPayload {
                type Props = Commands.Membership.Leave.ExecuteResult;

                type Result = Scripts.PermissionOverride.Purge.Props;

                type Signature = (props: Props) => Result;
            }

            namespace LeaveAccessCachePayload {
                type Props = Commands.Membership.Leave.ExecuteResult;

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace LeaveConfirmedPayload {
                type Props = Commands.Membership.Leave.ExecuteResult;

                type Result = Topics.Membership.LeaveConfirmedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace LeaveRejectedPayload {
                type Props = Commands.Membership.RejectLeave.Props;

                type Result = Topics.Membership.LeaveRejectedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace NotificationPayload {
                type Props = Commands.Membership.Leave.ExecuteResult;

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
