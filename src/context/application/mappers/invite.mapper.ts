import {
    NotificationContentKind,
    NotificationCategory,
    InvalidationScope,
    PlatformService,
    MessageTemplate,
} from "~context/enums";

export class InviteMapper implements Commands.Mappers.Invite.Contract {
    public notificationPayload(
        props: Commands.Mappers.Invite.NotificationPayload.Props,
    ): Commands.Mappers.Invite.NotificationPayload.Result {
        const [entity] = props.invites;

        return {
            params: { inviter: entity.inviter, realm: entity.realm.name },
            sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
            template: MessageTemplate.INVITE_RECEIVED,
            category: NotificationCategory.INVITES,
            kind: NotificationContentKind.TEMPLATE,
            dedupKey: `invite:${entity.id}`,
            recipient: entity.invitee,
            language: "en",
        };
    }

    public notificationCancelPayload(
        props: Commands.Mappers.Invite.NotificationCancelPayload.Props,
    ): Commands.Mappers.Invite.NotificationCancelPayload.Result {
        const [entity] = props.invites;

        return {
            dedupKey: `invite:${entity.id}`,
            override: {
                params: { inviter: entity.inviter, realm: entity.realm.name },
                sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
                template: MessageTemplate.INVITE_CANCELLED,
                category: NotificationCategory.INVITES,
                kind: NotificationContentKind.TEMPLATE,
                recipient: entity.invitee,
                language: "en",
            },
        };
    }

    public projectionAssignmentCreatePayload(
        props: Commands.Mappers.Invite.ProjectionAssignmentCreatePayload.Props,
    ): Commands.Mappers.Invite.ProjectionAssignmentCreatePayload.Result {
        return {
            assignments: props.assignments.map(({ id, role }) => ({
                assignment: id,
                role: role.id,
            })),
            account: props.assignments[0].account,
            realm: props.assignments[0].realm.id,
        };
    }

    public accessCachePayload(
        props: Commands.Mappers.Invite.AccessCachePayload.Props,
    ): Commands.Mappers.Invite.AccessCachePayload.Result {
        return {
            items: props.assignments.map(({ account, realm }) => ({
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            })),
        };
    }

    public membershipPayload(
        props: Commands.Mappers.Invite.MembershipPayload.Props,
    ): Commands.Mappers.Invite.MembershipPayload.Result {
        return {
            invitedBy: props.invitedBy,
            account: props.account,
            joinedAt: Date.now(),
            realm: props.realm,
        };
    }
}
