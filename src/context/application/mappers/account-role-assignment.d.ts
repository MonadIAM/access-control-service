declare namespace Commands {
    namespace Mappers {
        namespace AccountRoleAssignment {
            interface Contract extends PublicContract, InternalContract {}

            interface InternalContract {
                groupByRealm: GroupByRealm.Signature;
            }

            namespace GroupByRealm {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Map<string, Entities.AccountRoleAssignment[]>;

                type Signature = (props: Props) => Result;
            }

            interface PublicContract {
                joinAssignmentProjectionPayload: JoinAssignmentProjectionPayload.Signature;
                joinConfirmedPayload: JoinConfirmedPayload.Signature;
                joinRejectedPayload: JoinRejectedPayload.Signature;
                joinAccessCachePayload: JoinAccessCachePayload.Signature;
                notificationRevokePayload: NotificationRevokePayload.Signature;
                notificationGrantPayload: NotificationGrantPayload.Signature;
                projectionCreatePayload: ProjectionCreatePayload.Signature;
                projectionAssignPayload: ProjectionAssignPayload.Signature;
                projectionUpdatePayload: ProjectionUpdatePayload.Signature;
                cleanAccessCachePayload: CleanAccessCachePayload.Signature;
                projectionPurgePayload: ProjectionPurgePayload.Signature;
                accessCachePayload: AccessCachePayload.Signature;
            }

            namespace JoinAssignmentProjectionPayload {
                type Props = Commands.AccountRoleAssignment.Join.ExecuteResult;

                type Result = Scripts.AccountRoleAssignment.Create.Props;

                type Signature = (props: Props) => Result;
            }

            namespace JoinAccessCachePayload {
                type Props = Commands.AccountRoleAssignment.Join.ExecuteResult;

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace JoinConfirmedPayload {
                type Props = Commands.AccountRoleAssignment.Join.ExecuteResult;

                type Result = Topics.Realm.MembershipJoinConfirmedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace JoinRejectedPayload {
                type Props = Omit<Commands.AccountRoleAssignment.RejectJoin.Props, "incoming">;

                type Result = Topics.Realm.MembershipJoinRejectedMessage["payload"];

                type Signature = (props: Props) => Result;
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

                type Result = Scripts.AccountRoleAssignment.Update.Props[];

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionPurgePayload {
                type Props = {
                    assignments: Entities.AccountRoleAssignment[];
                };

                type Result = Scripts.AccountRoleAssignment.Purge.Props[];

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
