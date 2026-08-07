declare namespace Mappers {
    namespace Realm {
        interface Contract extends PublicContract {}

        interface PublicContract {
            excludeAssignmentPurgePayload: ExcludeAssignmentPurgePayload.Signature;
            excludeOverridePurgePayload: ExcludeOverridePurgePayload.Signature;
            excludeAccessCachePayload: ExcludeAccessCachePayload.Signature;
            excludeMembershipPayload: ExcludeMembershipPayload.Signature;
            projectionUpdatePayload: ProjectionUpdatePayload.Signature;
            projectionCreatePayload: ProjectionCreatePayload.Signature;
            projectionPurgePayload: ProjectionPurgePayload.Signature;
            realmLifecyclePayload: RealmLifecyclePayload.Signature;
            notificationPayload: NotificationPayload.Signature;
            accessCachePayload: AccessCachePayload.Signature;
        }

        namespace ExcludeAssignmentPurgePayload {
            type Props = {
                assignments: Entities.AccountRoleAssignment[];
            };

            type Result = Scripts.AccountRoleAssignment.Purge.Props;

            type Signature = (props: Props) => Result;
        }

        namespace ExcludeOverridePurgePayload {
            type Props = {
                overrides: Entities.PermissionOverride[];
            };

            type Result = Scripts.PermissionOverride.Purge.Props;

            type Signature = (props: Props) => Result;
        }

        namespace ExcludeAccessCachePayload {
            type Props = {
                realm: Entities.Realm;
                account: string;
            };

            type Result = Topics.AccessCache.Message["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace ExcludeMembershipPayload {
            type Props = {
                realm: Entities.Realm;
                account: string;
            };

            type Result = Topics.Membership.RevokeMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace ProjectionUpdatePayload {
            type Props = {
                realms: Entities.Realm[];
            };

            type Result = Scripts.Realm.Update.Props;

            type Signature = (props: Props) => Result;
        }

        namespace ProjectionCreatePayload {
            type Props = Awaited<Services.Realm.Create.Result>;

            type Result = Scripts.Realm.Create.Props;

            type Signature = (props: Props) => Result;
        }

        namespace ProjectionPurgePayload {
            type Props = {
                realms: Entities.Realm[];
            };

            type Result = Scripts.Realm.Purge.Props;

            type Signature = (props: Props) => Result;
        }

        namespace RealmLifecyclePayload {
            type Props = {
                realms: Entities.Realm[];
            };

            type Result = Topics.Realm.Message["payload"][];

            type Signature = (props: Props) => Result;
        }

        namespace NotificationPayload {
            type Props = {
                realm: Entities.Realm;
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace AccessCachePayload {
            type Props = {
                realms: Entities.Realm[];
            };

            type Result = Topics.AccessCache.Message["payload"];

            type Signature = (props: Props) => Result;
        }
    }
}
