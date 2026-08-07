import {
    NotificationContentKind,
    NotificationCategory,
    InvalidationScope,
    PlatformService,
    MessageTemplate,
} from "~context/enums";

export class InviteMapper implements Mappers.Invite.Contract {
    public notificationPayload(props: Mappers.Invite.NotificationPayload.Props): Mappers.Invite.NotificationPayload.Result {
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
        props: Mappers.Invite.NotificationCancelPayload.Props,
    ): Mappers.Invite.NotificationCancelPayload.Result {
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
        props: Mappers.Invite.ProjectionAssignmentCreatePayload.Props,
    ): Mappers.Invite.ProjectionAssignmentCreatePayload.Result {
        return {
            assignments: props.assignments.map(({ id, role }) => ({
                assignment: id,
                role: role.id,
            })),
            account: props.assignments[0].account,
            realm: props.assignments[0].realm.id,
        };
    }

    public accessCachePayload(props: Mappers.Invite.AccessCachePayload.Props): Mappers.Invite.AccessCachePayload.Result {
        return {
            items: props.assignments.map(({ account, realm }) => ({
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            })),
        };
    }

    public membershipPayload(props: Mappers.Invite.MembershipPayload.Props): Mappers.Invite.MembershipPayload.Result {
        return {
            invitedBy: props.invitedBy,
            account: props.account,
            joinedAt: Date.now(),
            realm: props.realm,
        };
    }
}
