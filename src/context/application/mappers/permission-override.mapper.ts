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
        const [{ permission, account, effect, realm, id, expiresAt }] = props.overrides;

        return {
            expiresAt: expiresAt?.getTime() ?? null,
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

        return Array.from(groups, ([realm, overrides]) => ({
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

        return Array.from(groups, ([realm, overrides]) => ({
            items: overrides.map(({ id, account, permission, effect, expiresAt }) => ({
                expiresAt: expiresAt?.getTime() ?? null,
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
        const checkpoints = new Map<string, Topics.ProjectionJournal.Checkpoint["payload"]>();
        const seen = new Set<string>();

        for (const entity of props.overrides) {
            const realm = entity.realm.id;
            const account = entity.account;
            const key = `${realm}:${account}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            let checkpoint = checkpoints.get(realm);
            if (!checkpoint) {
                checkpoint = { realm, items: [] };
                checkpoints.set(realm, checkpoint);
            }
            checkpoint.items.push({ scope: InvalidationScope.ACCOUNT_REALM, realm, account });
        }

        return Array.from(checkpoints.values());
    }
}
