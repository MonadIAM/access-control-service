import { SystemRealm } from "~infrastructure/datasets/realm.dataset";
import { InvalidationScope } from "~context/enums";

export class RealmMapper implements Commands.Mappers.Realm.Contract {
    public projectionCreatePayload(
        props: Commands.Mappers.Realm.ProjectionCreatePayload.Props,
    ): Commands.Mappers.Realm.ProjectionCreatePayload.Result {
        const { assignments, paths, realm, roles } = props;

        return {
            rolePermissionAssignments: assignments.permission.map(({ id, role, permission, scope }) => ({
                permission: permission.id,
                assignment: id,
                role: role.id,
                scope,
            })),
            accountRoleAssignments: assignments.role.map(({ id, account, role }) => ({
                assignment: id,
                role: role.id,
                account,
            })),
            paths: paths.map(({ ancestor, descendant, depth }) => ({
                descendant: descendant.id,
                ancestor: ancestor.id,
                depth,
            })),
            roles: roles.map(({ id }) => id),
            permissionRealm: SystemRealm.id,
            realm: realm.id,
        };
    }

    public projectionPurgePayload(
        props: Commands.Mappers.Realm.ProjectionPurgePayload.Props,
    ): Commands.Mappers.Realm.ProjectionPurgePayload.Result {
        return { realms: props.realms.map(({ id }) => id) };
    }

    public projectionUpdatePayload(
        props: Commands.Mappers.Realm.ProjectionUpdatePayload.Props,
    ): Commands.Mappers.Realm.ProjectionUpdatePayload.Result {
        return {
            realms: props.realms.map(({ id }) => id),
            isRevoked: props.realms[0].isRevoked,
        };
    }

    public accessCachePayload(
        props: Commands.Mappers.Realm.AccessCachePayload.Props,
    ): Commands.Mappers.Realm.AccessCachePayload.Result {
        return {
            items: props.realms.map(({ id }) => ({
                scope: InvalidationScope.REALM,
                realm: id,
            })),
        };
    }

    public realmLifecyclePayload(
        props: Commands.Mappers.Realm.RealmLifecyclePayload.Props,
    ): Commands.Mappers.Realm.RealmLifecyclePayload.Result {
        return props.realms.map(({ id, version }) => ({
            actor: props.actor,
            realm: id,
            input: {
                version: version + 1,
            },
        }));
    }
}
