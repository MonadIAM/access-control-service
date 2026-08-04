declare namespace Commands {
    namespace Realm {
        interface Contract extends ControllerContract, InternalContract {}

        interface InternalContract {
            realmLifecyclePayloadMapper: RealmLifecyclePayloadMapper.Signature;
            notificationPayloadMapper: NotificationPayloadMapper.Signature;
            accessCachePayloadMapper: AccessCachePayloadMapper.Signature;
            membershipPayloadMapper: MembershipPayloadMapper.Signature;
        }

        namespace RealmLifecyclePayloadMapper {
            type Props = Entities.Realm[];

            type Result = Topics.Realm.Message["payload"][];

            type Signature = (props: Props) => Result;
        }

        namespace NotificationPayloadMapper {
            type Props = Exclude.ExecuteResult;

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace AccessCachePayloadMapper {
            type Props =
                | {
                      account: string;
                      realm: string;
                  }
                | Entities.Realm[];

            type Result = Topics.AccessCache.Message["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace MembershipPayloadMapper {
            type Props = {
                account: string;
                realm: string;
            };

            type Result = Topics.Membership.RevokeMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        interface ControllerContract {
            restore: Restore.Signature;
            exclude: Exclude.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                actor: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: Extract.Meta;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Exclude {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    account: string;
                    reason: string;
                };
                context: Extract.Meta;
            };

            type ExecuteResult = {
                assignments: Entities.AccountRoleAssignment[];
                overrides: Entities.PermissionOverride[];
                realm: Entities.Realm;
                account: string;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                actor: string;
                input: {
                    code: string;
                    name: string;
                    description?: string;
                };
                context: Extract.Meta;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                id: string;
                actor: string;
                input: {
                    patch: Partial<Entities.Realm.MutableFields>;
                    reason: string;
                };
                context: Extract.Meta;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                actor: string;
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
