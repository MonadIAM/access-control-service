declare namespace Mappers {
    namespace Invite {
        interface Contract extends PublicContract {}

        interface PublicContract {
            projectionAssignmentCreatePayload: ProjectionAssignmentCreatePayload.Signature;
            notificationCancelPayload: NotificationCancelPayload.Signature;
            notificationPayload: NotificationPayload.Signature;
            accessCachePayload: AccessCachePayload.Signature;
            membershipPayload: MembershipPayload.Signature;
        }

        namespace ProjectionAssignmentCreatePayload {
            type Props = {
                assignments: Entities.AccountRoleAssignment[];
            };

            type Result = Scripts.AccountRoleAssignment.Create.Props;

            type Signature = (props: Props) => Result;
        }

        namespace NotificationCancelPayload {
            type Props = {
                invites: Entities.Invite[];
            };

            type Result = Topics.Notification.CancelMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace NotificationPayload {
            type Props = {
                invites: Entities.Invite[];
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace AccessCachePayload {
            type Props = {
                assignments: Entities.AccountRoleAssignment[];
            };

            type Result = Topics.AccessCache.Message["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace MembershipPayload {
            type Props = {
                invitedBy: string;
                account: string;
                realm: string;
            };

            type Result = Topics.Membership.GrantMessage["payload"];

            type Signature = (props: Props) => Result;
        }
    }
}
