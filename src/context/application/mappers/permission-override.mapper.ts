import { InvalidationScope } from "~context/enums";

export class PermissionOverrideMapper implements Commands.Mappers.PermissionOverride.Contract {
    public groupByRealm(
        props: Commands.Mappers.PermissionOverride.GroupByRealm.Props,
    ): Commands.Mappers.PermissionOverride.GroupByRealm.Result {
        const groups = new Map<string, Entities.PermissionOverride[]>();

        for (const override of props.overrides) {
            const realm = override.realm.id;
            const group = groups.get(realm);

            if (group) {
                group.push(override);
            } else {
                groups.set(realm, [override]);
            }
        }

        return groups;
    }

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
        return Array.from(this.groupByRealm({ overrides: props.overrides }), ([realm, overrides]) => ({
            items: overrides.map(({ account, permission }) => ({
                permissionRealm: permission.realm.id,
                permission: permission.id,
                account,
                realm,
            })),
            realm,
        }));
    }

    public projectionUpdatePayload(
        props: Commands.Mappers.PermissionOverride.ProjectionUpdatePayload.Props,
    ): Commands.Mappers.PermissionOverride.ProjectionUpdatePayload.Result {
        return Array.from(this.groupByRealm({ overrides: props.overrides }), ([realm, overrides]) => ({
            items: overrides.map(({ id, account, permission, effect }) => ({
                permissionRealm: permission.realm.id,
                permission: permission.id,
                override: id,
                account,
                effect,
                realm,
            })),
            isRevoked: overrides[0].isRevoked,
            realm,
        }));
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
