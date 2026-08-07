import { InvalidationScope } from "~context/enums";

export class PermissionOverrideMapper implements Commands.Mappers.PermissionOverride.Contract {
    public projectionCreatePayload(
        props: Commands.Mappers.PermissionOverride.ProjectionCreatePayload.Props,
    ): Commands.Mappers.PermissionOverride.ProjectionCreatePayload.Result {
        const [{ permission, account, effect, realm, id }] = props.overrides;

        return {
            permissionRealm: permission.realm.id,
            permission: permission.id,
            realm: realm.id,
            override: id,
            account,
            effect,
        };
    }

    public projectionPurgePayload(
        props: Commands.Mappers.PermissionOverride.ProjectionPurgePayload.Props,
    ): Commands.Mappers.PermissionOverride.ProjectionPurgePayload.Result {
        return {
            items: props.overrides.map(({ realm, account, permission }) => ({
                permissionRealm: permission.realm.id,
                permission: permission.id,
                realm: realm.id,
                account,
            })),
        };
    }

    public projectionUpdatePayload(
        props: Commands.Mappers.PermissionOverride.ProjectionUpdatePayload.Props,
    ): Commands.Mappers.PermissionOverride.ProjectionUpdatePayload.Result {
        return {
            items: props.overrides.map(({ id, realm, account, permission, effect }) => ({
                permissionRealm: permission.realm.id,
                permission: permission.id,
                realm: realm.id,
                override: id,
                account,
                effect,
            })),
            isRevoked: props.overrides[0].isRevoked,
        };
    }

    public accessCachePayload(
        props: Commands.Mappers.PermissionOverride.AccessCachePayload.Props,
    ): Commands.Mappers.PermissionOverride.AccessCachePayload.Result {
        return {
            items: props.overrides.map(({ account, realm }) => ({
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            })),
        };
    }
}
