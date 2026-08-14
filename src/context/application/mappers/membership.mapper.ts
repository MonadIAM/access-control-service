import {
    NotificationContentKind,
    NotificationCategory,
    InvalidationScope,
    PlatformService,
    MessageTemplate,
} from "~context/enums";

export class MembershipMapper implements Commands.Mappers.Membership.Contract {
    public joinAssignmentProjectionPayload(
        props: Commands.Mappers.Membership.JoinAssignmentProjectionPayload.Props,
    ): Commands.Mappers.Membership.JoinAssignmentProjectionPayload.Result {
        return {
            assignments: props.assignments.map(({ id, role }) => ({
                assignment: id,
                role: role.id,
            })),
            account: props.request.account,
            realm: props.realm,
        };
    }

    public joinAccessCachePayload(
        props: Commands.Mappers.Membership.JoinAccessCachePayload.Props,
    ): Commands.Mappers.Membership.JoinAccessCachePayload.Result {
        return {
            items: [
                {
                    scope: InvalidationScope.ACCOUNT_REALM,
                    account: props.request.account,
                    realm: props.realm,
                },
            ],
        };
    }

    public joinConfirmedPayload(
        props: Commands.Mappers.Membership.JoinConfirmedPayload.Props,
    ): Commands.Mappers.Membership.JoinConfirmedPayload.Result {
        const [assignment] = props.assignments;

        return {
            actor: props.actor,
            realm: props.realm,
            input: {
                process: props.request.process,
                command: props.request.command,
                account: props.request.account,
                invite: props.request.invite,
                assignment: assignment.id,
                role: assignment.role.id,
                joinedAt: Date.now(),
            },
        };
    }

    public joinRejectedPayload(
        props: Commands.Mappers.Membership.JoinRejectedPayload.Props,
    ): Commands.Mappers.Membership.JoinRejectedPayload.Result {
        return {
            actor: props.request.actor,
            realm: props.request.realm,
            input: {
                process: props.request.input.process,
                command: props.request.input.command,
                invite: props.request.input.invite,
                reason: props.reason,
            },
        };
    }

    public leaveAssignmentProjectionPayload(
        props: Commands.Mappers.Membership.LeaveAssignmentProjectionPayload.Props,
    ): Commands.Mappers.Membership.LeaveAssignmentProjectionPayload.Result {
        return {
            items: props.assignments.map(({ realm, account, role }) => ({
                realm: realm.id,
                role: role.id,
                account,
            })),
        };
    }

    public leaveOverrideProjectionPayload(
        props: Commands.Mappers.Membership.LeaveOverrideProjectionPayload.Props,
    ): Commands.Mappers.Membership.LeaveOverrideProjectionPayload.Result {
        return {
            items: props.overrides.map(({ permission, account, realm }) => ({
                permissionRealm: permission.realm.id,
                permission: permission.id,
                realm: realm.id,
                account,
            })),
        };
    }

    public leaveAccessCachePayload(
        props: Commands.Mappers.Membership.LeaveAccessCachePayload.Props,
    ): Commands.Mappers.Membership.LeaveAccessCachePayload.Result {
        return {
            items: [
                {
                    scope: InvalidationScope.ACCOUNT_REALM,
                    account: props.request.account,
                    realm: props.realm,
                },
            ],
        };
    }

    public leaveConfirmedPayload(
        props: Commands.Mappers.Membership.LeaveConfirmedPayload.Props,
    ): Commands.Mappers.Membership.LeaveConfirmedPayload.Result {
        return {
            actor: props.actor,
            realm: props.realm,
            input: {
                process: props.request.process,
                command: props.request.command,
                account: props.request.account,
                leftAt: Date.now(),
            },
        };
    }

    public leaveRejectedPayload(
        props: Commands.Mappers.Membership.LeaveRejectedPayload.Props,
    ): Commands.Mappers.Membership.LeaveRejectedPayload.Result {
        return {
            actor: props.request.actor,
            realm: props.request.realm,
            input: {
                process: props.request.input.process,
                command: props.request.input.command,
                account: props.request.input.account,
                reason: props.reason,
            },
        };
    }

    public notificationPayload(
        props: Commands.Mappers.Membership.NotificationPayload.Props,
    ): Commands.Mappers.Membership.NotificationPayload.Result {
        return {
            actor: props.actor,
            realm: props.realm,
            input: {
                sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
                template: MessageTemplate.REALM_EXCLUDED,
                kind: NotificationContentKind.TEMPLATE,
                category: NotificationCategory.SYSTEM,
                params: { realm: props.realmEntity.name },
                recipient: props.request.account,
                language: "en",
            },
        };
    }
}
