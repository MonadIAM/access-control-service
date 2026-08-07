import { InvalidationScope } from "~context/enums";

export class PermissionOverrideMapper implements Mappers.PermissionOverride.Contract {
    public projectionCreatePayload(
        props: Mappers.PermissionOverride.ProjectionCreatePayload.Props,
    ): Mappers.PermissionOverride.ProjectionCreatePayload.Result {
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
        props: Mappers.PermissionOverride.ProjectionPurgePayload.Props,
    ): Mappers.PermissionOverride.ProjectionPurgePayload.Result {
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
        props: Mappers.PermissionOverride.ProjectionUpdatePayload.Props,
    ): Mappers.PermissionOverride.ProjectionUpdatePayload.Result {
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
        props: Mappers.PermissionOverride.AccessCachePayload.Props,
    ): Mappers.PermissionOverride.AccessCachePayload.Result {
        return {
            items: props.overrides.map(({ account, realm }) => ({
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            })),
        };
    }
}
