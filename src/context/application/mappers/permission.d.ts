declare namespace Commands {
    namespace Mappers {
        namespace Permission {
            interface Contract extends PublicContract {}

            interface PublicContract {
                projectionCreatePayload: ProjectionCreatePayload.Signature;
                projectionUpdatePayload: ProjectionUpdatePayload.Signature;
                projectionPurgePayload: ProjectionPurgePayload.Signature;
                accessCachePayload: AccessCachePayload.Signature;
            }

            namespace ProjectionCreatePayload {
                type Props = {
                    permission: Entities.Permission;
                };

                type Result = Scripts.Permission.Create.Props;

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionUpdatePayload {
                type Props = {
                    permissions: Entities.Permission[];
                };

                type Result = Scripts.Permission.Update.Props;

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionPurgePayload {
                type Props = {
                    permissions: Entities.Permission[];
                };

                type Result = Scripts.Permission.Purge.Props;

                type Signature = (props: Props) => Result;
            }

            namespace AccessCachePayload {
                type Props = {
                    permissions: Entities.Permission[];
                };

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
