declare namespace Mappers {
    namespace RolePermissionAssignment {
        interface Contract extends PublicContract {}

        interface PublicContract {
            projectionCreatePayload: ProjectionCreatePayload.Signature;
            projectionUpdatePayload: ProjectionUpdatePayload.Signature;
            projectionPurgePayload: ProjectionPurgePayload.Signature;
            accessCachePayload: AccessCachePayload.Signature;
        }

        namespace ProjectionCreatePayload {
            type Props = {
                assignments: Entities.RolePermissionAssignment[];
            };

            type Result = Scripts.RolePermissionAssignment.Create.Props;

            type Signature = (props: Props) => Result;
        }

        namespace ProjectionUpdatePayload {
            type Props = {
                assignments: Entities.RolePermissionAssignment[];
            };

            type Result = Scripts.RolePermissionAssignment.Update.Props;

            type Signature = (props: Props) => Result;
        }

        namespace ProjectionPurgePayload {
            type Props = {
                assignments: Entities.RolePermissionAssignment[];
            };

            type Result = Scripts.RolePermissionAssignment.Purge.Props;

            type Signature = (props: Props) => Result;
        }

        namespace AccessCachePayload {
            type Props = {
                assignments: Entities.RolePermissionAssignment[];
            };

            type Result = Topics.AccessCache.Message["payload"];

            type Signature = (props: Props) => Result;
        }
    }
}
