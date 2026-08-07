import { InvalidationScope } from "~context/enums";

export class PermissionMapper implements Mappers.Permission.Contract {
    public projectionCreatePayload(
        props: Mappers.Permission.ProjectionCreatePayload.Props,
    ): Mappers.Permission.ProjectionCreatePayload.Result {
        return {
            permission: props.permission.id,
            code: props.permission.code,
            realm: props.permission.realm.id,
        };
    }

    public projectionPurgePayload(
        props: Mappers.Permission.ProjectionPurgePayload.Props,
    ): Mappers.Permission.ProjectionPurgePayload.Result {
        return {
            permissions: props.permissions.map(({ id }) => id),
            realm: props.permissions[0].realm.id,
        };
    }

    public projectionUpdatePayload(
        props: Mappers.Permission.ProjectionUpdatePayload.Props,
    ): Mappers.Permission.ProjectionUpdatePayload.Result {
        return {
            permissions: props.permissions.map(({ id }) => id),
            isRevoked: props.permissions[0].isRevoked,
            realm: props.permissions[0].realm.id,
        };
    }

    public accessCachePayload(
        props: Mappers.Permission.AccessCachePayload.Props,
    ): Mappers.Permission.AccessCachePayload.Result {
        return {
            items: props.permissions.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
