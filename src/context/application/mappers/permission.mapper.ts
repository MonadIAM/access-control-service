import { InvalidationScope } from "~context/enums";

export class PermissionMapper implements Commands.Mappers.Permission.Contract {
    public projectionCreatePayload(
        props: Commands.Mappers.Permission.ProjectionCreatePayload.Props,
    ): Commands.Mappers.Permission.ProjectionCreatePayload.Result {
        return {
            permission: props.permission.id,
            code: props.permission.code,
            realm: props.permission.realm.id,
        };
    }

    public projectionPurgePayload(
        props: Commands.Mappers.Permission.ProjectionPurgePayload.Props,
    ): Commands.Mappers.Permission.ProjectionPurgePayload.Result {
        return {
            permissions: props.permissions.map(({ id }) => id),
            realm: props.permissions[0].realm.id,
        };
    }

    public projectionUpdatePayload(
        props: Commands.Mappers.Permission.ProjectionUpdatePayload.Props,
    ): Commands.Mappers.Permission.ProjectionUpdatePayload.Result {
        return {
            permissions: props.permissions.map(({ id }) => id),
            isRevoked: props.permissions[0].isRevoked,
            realm: props.permissions[0].realm.id,
        };
    }

    public accessCachePayload(
        props: Commands.Mappers.Permission.AccessCachePayload.Props,
    ): Commands.Mappers.Permission.AccessCachePayload.Result {
        return {
            items: props.permissions.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
