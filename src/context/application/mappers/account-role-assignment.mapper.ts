import {
    NotificationContentKind,
    NotificationCategory,
    InvalidationScope,
    PlatformService,
    MessageTemplate,
} from "~context/enums";

export class AccountRoleAssignmentMapper implements Mappers.AccountRoleAssignment.Contract {
    public projectionCreatePayload(
        props: Mappers.AccountRoleAssignment.ProjectionCreatePayload.Props,
    ): Mappers.AccountRoleAssignment.ProjectionCreatePayload.Result {
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
        props: Mappers.AccountRoleAssignment.ProjectionAssignPayload.Props,
    ): Mappers.AccountRoleAssignment.ProjectionAssignPayload.Result {
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
        props: Mappers.AccountRoleAssignment.ProjectionPurgePayload.Props,
    ): Mappers.AccountRoleAssignment.ProjectionPurgePayload.Result {
        return {
            items: props.assignments.map(({ realm, account, role }) => ({
                realm: realm.id,
                role: role.id,
                account,
            })),
        };
    }

    public projectionUpdatePayload(
        props: Mappers.AccountRoleAssignment.ProjectionUpdatePayload.Props,
    ): Mappers.AccountRoleAssignment.ProjectionUpdatePayload.Result {
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
        props: Mappers.AccountRoleAssignment.NotificationGrantPayload.Props,
    ): Mappers.AccountRoleAssignment.NotificationGrantPayload.Result {
        const [{ account, realm }] = props.assignments;

        return {
            params: { realm: realm.name, role: props.assignments.map(({ role }) => role.name).join(", ") },
            sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
            template: MessageTemplate.ASSIGNMENT_GRANTED,
            kind: NotificationContentKind.TEMPLATE,
            category: NotificationCategory.SYSTEM,
            recipient: account,
            language: "en",
        };
    }

    public notificationRevokePayload(
        props: Mappers.AccountRoleAssignment.NotificationRevokePayload.Props,
    ): Mappers.AccountRoleAssignment.NotificationRevokePayload.Result {
        const byAccount = new Map<string, Entities.AccountRoleAssignment[]>();

        for (const entity of props.assignments) {
            byAccount.set(entity.account, [...(byAccount.get(entity.account) ?? []), entity]);
        }

        return [...byAccount.entries()].map(([account, entities]) => ({
            params: { realm: entities[0].realm.name, role: entities.map(({ role }) => role.name).join(", ") },
            sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
            template: MessageTemplate.ASSIGNMENT_REVOKED,
            kind: NotificationContentKind.TEMPLATE,
            category: NotificationCategory.SYSTEM,
            recipient: account,
            language: "en",
        }));
    }

    public accessCachePayload(
        props: Mappers.AccountRoleAssignment.AccessCachePayload.Props,
    ): Mappers.AccountRoleAssignment.AccessCachePayload.Result {
        return {
            items: props.assignments.map(({ account, realm }) => ({
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            })),
        };
    }
}
