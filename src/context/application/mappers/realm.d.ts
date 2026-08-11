declare namespace Commands {
    namespace Mappers {
        namespace Realm {
            interface Contract extends PublicContract {}

            interface PublicContract {
                projectionUpdatePayload: ProjectionUpdatePayload.Signature;
                projectionCreatePayload: ProjectionCreatePayload.Signature;
                projectionPurgePayload: ProjectionPurgePayload.Signature;
                realmLifecyclePayload: RealmLifecyclePayload.Signature;
                accessCachePayload: AccessCachePayload.Signature;
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

            namespace AccessCachePayload {
                type Props = {
                    realms: Entities.Realm[];
                };

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
