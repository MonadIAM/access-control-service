declare namespace Commands {
    namespace Mappers {
        namespace AccountRoleAssignment {
            interface Contract extends PublicContract {}

            interface PublicContract {
                notificationRevokePayload: NotificationRevokePayload.Signature;
                notificationGrantPayload: NotificationGrantPayload.Signature;
                projectionCreatePayload: ProjectionCreatePayload.Signature;
                projectionAssignPayload: ProjectionAssignPayload.Signature;
                projectionUpdatePayload: ProjectionUpdatePayload.Signature;
                cleanAccessCachePayload: CleanAccessCachePayload.Signature;
                projectionPurgePayload: ProjectionPurgePayload.Signature;
                accessCachePayload: AccessCachePayload.Signature;
            }

            namespace NotificationRevokePayload {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                    actor: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"][];

                type Signature = (props: Props) => Result;
            }

            namespace NotificationGrantPayload {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                    actor: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionCreatePayload {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Scripts.AccountRoleAssignment.Create.Props;

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionAssignPayload {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Scripts.AccountRoleAssignment.Create.Props;

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionUpdatePayload {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Scripts.AccountRoleAssignment.Update.Props;

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionPurgePayload {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Scripts.AccountRoleAssignment.Purge.Props;

                type Signature = (props: Props) => Result;
            }

            namespace AccessCachePayload {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace CleanAccessCachePayload {
                type Props = Commands.AccountRoleAssignment.Clean.ExecuteResult;

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
