import {
    NotificationContentKind,
    NotificationCategory,
    InvalidationScope,
    PlatformService,
    MessageTemplate,
} from "~context/enums";

export class AccountRoleAssignmentMapper implements Commands.Mappers.AccountRoleAssignment.Contract {
    public projectionCreatePayload(
        props: Commands.Mappers.AccountRoleAssignment.ProjectionCreatePayload.Props,
    ): Commands.Mappers.AccountRoleAssignment.ProjectionCreatePayload.Result {
        return {
            assignments: props.assignments.map(({ id, role }) => ({
                assignment: id,
                role: role.id,
            })),
            account: props.assignments[0].account,
            realm: props.assignments[0].realm.id,
        };
    }

    public projectionAssignPayload(
        props: Commands.Mappers.AccountRoleAssignment.ProjectionAssignPayload.Props,
    ): Commands.Mappers.AccountRoleAssignment.ProjectionAssignPayload.Result {
        const [entity] = props.assignments;

        return {
            realm: entity.realm.id,
            account: entity.account,
            assignments: [
                {
                    assignment: entity.id,
                    role: entity.role.id,
                },
            ],
        };
    }

    public projectionPurgePayload(
        props: Commands.Mappers.AccountRoleAssignment.ProjectionPurgePayload.Props,
    ): Commands.Mappers.AccountRoleAssignment.ProjectionPurgePayload.Result {
        return {
            items: props.assignments.map(({ realm, account, role }) => ({
                realm: realm.id,
                role: role.id,
                account,
            })),
        };
    }

    public projectionUpdatePayload(
        props: Commands.Mappers.AccountRoleAssignment.ProjectionUpdatePayload.Props,
    ): Commands.Mappers.AccountRoleAssignment.ProjectionUpdatePayload.Result {
        return {
            isRevoked: props.assignments[0].isRevoked,
            items: props.assignments.map(({ id, realm, account, role }) => ({
                realm: realm.id,
                assignment: id,
                role: role.id,
                account,
            })),
        };
    }

    public notificationGrantPayload(
        props: Commands.Mappers.AccountRoleAssignment.NotificationGrantPayload.Props,
    ): Commands.Mappers.AccountRoleAssignment.NotificationGrantPayload.Result {
        const [{ account, realm }] = props.assignments;

        return {
            actor: props.actor,
            realm: realm.id,
            input: {
                params: { realm: realm.name, role: props.assignments.map(({ role }) => role.name).join(", ") },
                sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
                template: MessageTemplate.ASSIGNMENT_GRANTED,
                kind: NotificationContentKind.TEMPLATE,
                category: NotificationCategory.SYSTEM,
                recipient: account,
                language: "en",
            },
        };
    }

    public notificationRevokePayload(
        props: Commands.Mappers.AccountRoleAssignment.NotificationRevokePayload.Props,
    ): Commands.Mappers.AccountRoleAssignment.NotificationRevokePayload.Result {
        const byAccount = new Map<string, Entities.AccountRoleAssignment[]>();

        for (const entity of props.assignments) {
            byAccount.set(entity.account, [...(byAccount.get(entity.account) ?? []), entity]);
        }

        return [...byAccount.entries()].map(([account, entities]) => ({
            actor: props.actor,
            realm: entities[0].realm.id,
            input: {
                params: { realm: entities[0].realm.name, role: entities.map(({ role }) => role.name).join(", ") },
                sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
                template: MessageTemplate.ASSIGNMENT_REVOKED,
                kind: NotificationContentKind.TEMPLATE,
                category: NotificationCategory.SYSTEM,
                recipient: account,
                language: "en",
            },
        }));
    }

    public accessCachePayload(
        props: Commands.Mappers.AccountRoleAssignment.AccessCachePayload.Props,
    ): Commands.Mappers.AccountRoleAssignment.AccessCachePayload.Result {
        return {
            items: props.assignments.map(({ account, realm }) => ({
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            })),
        };
    }

    public cleanAccessCachePayload(
        props: Commands.Mappers.AccountRoleAssignment.CleanAccessCachePayload.Props,
    ): Commands.Mappers.AccountRoleAssignment.CleanAccessCachePayload.Result {
        const invalidations = new Map<string, Topics.AccessCache.Message["payload"]["items"][number]>();

        for (const { account, realm } of [...props.assignments, ...props.overrides]) {
            invalidations.set(`${account}:${realm.id}`, {
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            });
        }

        return { items: [...invalidations.values()] };
    }
}
