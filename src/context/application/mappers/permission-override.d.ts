declare namespace Commands {
    namespace Mappers {
        namespace PermissionOverride {
            interface Contract extends PublicContract {}

            interface PublicContract {
                projectionCreatePayload: ProjectionCreatePayload.Signature;
                projectionUpdatePayload: ProjectionUpdatePayload.Signature;
                projectionPurgePayload: ProjectionPurgePayload.Signature;
                accessCachePayload: AccessCachePayload.Signature;
            }

            namespace ProjectionCreatePayload {
                type Props = {
                    overrides: Entities.PermissionOverride[];
                };

                type Result = Scripts.PermissionOverride.Create.Props;

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionUpdatePayload {
                type Props = {
                    overrides: Entities.PermissionOverride[];
                };

                type Result = Scripts.PermissionOverride.Update.Props;

                type Signature = (props: Props) => Result;
            }

            namespace ProjectionPurgePayload {
                type Props = {
                    overrides: Entities.PermissionOverride[];
                };

                type Result = Scripts.PermissionOverride.Purge.Props;

                type Signature = (props: Props) => Result;
            }

            namespace AccessCachePayload {
                type Props = {
                    overrides: Entities.PermissionOverride[];
                };

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
