import { SystemRealm } from "~infrastructure/datasets/realm.dataset";
import {
    NotificationContentKind,
    NotificationCategory,
    InvalidationScope,
    PlatformService,
    MessageTemplate,
} from "~context/enums";

export class RealmMapper implements Mappers.Realm.Contract {
    public projectionCreatePayload(
        props: Mappers.Realm.ProjectionCreatePayload.Props,
    ): Mappers.Realm.ProjectionCreatePayload.Result {
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
        props: Mappers.Realm.ProjectionPurgePayload.Props,
    ): Mappers.Realm.ProjectionPurgePayload.Result {
        return { realms: props.realms.map(({ id }) => id) };
    }

    public projectionUpdatePayload(
        props: Mappers.Realm.ProjectionUpdatePayload.Props,
    ): Mappers.Realm.ProjectionUpdatePayload.Result {
        return {
            realms: props.realms.map(({ id }) => id),
            isRevoked: props.realms[0].isRevoked,
        };
    }

    public accessCachePayload(props: Mappers.Realm.AccessCachePayload.Props): Mappers.Realm.AccessCachePayload.Result {
        return {
            items: props.realms.map(({ id }) => ({
                scope: InvalidationScope.REALM,
                realm: id,
            })),
        };
    }

    public realmLifecyclePayload(
        props: Mappers.Realm.RealmLifecyclePayload.Props,
    ): Mappers.Realm.RealmLifecyclePayload.Result {
        return props.realms.map(({ id, version }) => ({
            version: version + 1,
            realm: id,
        }));
    }

    public excludeAssignmentPurgePayload(
        props: Mappers.Realm.ExcludeAssignmentPurgePayload.Props,
    ): Mappers.Realm.ExcludeAssignmentPurgePayload.Result {
        return {
            items: props.assignments.map(({ realm, account, role }) => ({
                realm: realm.id,
                role: role.id,
                account,
            })),
        };
    }

    public excludeOverridePurgePayload(
        props: Mappers.Realm.ExcludeOverridePurgePayload.Props,
    ): Mappers.Realm.ExcludeOverridePurgePayload.Result {
        return {
            items: props.overrides.map(({ permission, account, realm }) => ({
                permissionRealm: SystemRealm.id,
                permission: permission.id,
                realm: realm.id,
                account,
            })),
        };
    }

    public excludeAccessCachePayload(
        props: Mappers.Realm.ExcludeAccessCachePayload.Props,
    ): Mappers.Realm.ExcludeAccessCachePayload.Result {
        return {
            items: [
                {
                    scope: InvalidationScope.ACCOUNT_REALM,
                    account: props.account,
                    realm: props.realm.id,
                },
            ],
        };
    }

    public excludeMembershipPayload(
        props: Mappers.Realm.ExcludeMembershipPayload.Props,
    ): Mappers.Realm.ExcludeMembershipPayload.Result {
        return {
            account: props.account,
            realm: props.realm.id,
        };
    }

    public notificationPayload(props: Mappers.Realm.NotificationPayload.Props): Mappers.Realm.NotificationPayload.Result {
        return {
            sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
            template: MessageTemplate.REALM_EXCLUDED,
            kind: NotificationContentKind.TEMPLATE,
            category: NotificationCategory.SYSTEM,
            params: { realm: props.realm.name },
            recipient: props.account,
            language: "en",
        };
    }
}
