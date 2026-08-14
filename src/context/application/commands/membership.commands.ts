import { Inject, Injectable, Scope } from "@nestjs/common";

import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { CONSUMER_META } from "~context/constants";
import { Exception } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    PERMISSION_OVERRIDE_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/domain/repositories";
import {
    NotificationTopicAction,
    AccessCacheTopicAction,
    MembershipTopicAction,
    ActionType,
    EntityType,
    KafkaTopic,
} from "~context/enums";

import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE, PERMISSION_OVERRIDE_SERVICE } from "../services";
import { MembershipMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipCommands implements Commands.Membership.Contract {
    private readonly mapper: Commands.Mappers.Membership.Contract;
    private readonly resource = "Membership";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.PublicContract,
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.CommandContract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.CommandContract,
    ) {
        this.mapper = new MembershipMapper();
    }

    public async join(props: Commands.Membership.Join.Props): Commands.Membership.Join.Result {
        const { input, actor, realm } = props;

        try {
            await this.transactionalService.run<Commands.Membership.Join.ExecuteResult>({
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.joinAssignmentProjectionPayload,
                        actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.joinAccessCachePayload,
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    },
                    {
                        payloadMapper: this.mapper.joinConfirmedPayload,
                        actionType: MembershipTopicAction.JOIN_CONFIRMED,
                        destinationTopic: KafkaTopic.MEMBERSHIP,
                    },
                ],
                audit: {
                    entityType: EntityType.ROLE_ASSIGNMENT,
                    actionType: ActionType.CREATE,
                    context: CONSUMER_META,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const existingAssignment = await this.accountRoleAssignmentRepository.findUnique({
                        where: { account: input.account, realm, role: input.role, isRevoked: false },
                        options: { populate: ["realm", "role"] },
                        transaction,
                    });

                    if (existingAssignment) {
                        return { request: input, actor, realm, assignments: [existingAssignment] };
                    }

                    const [realmEntity, role] = await Promise.all([
                        this.realmRepository.findUniqueOrThrow({
                            where: { id: realm },
                            transaction,
                        }),
                        this.roleRepository.findUniqueOrThrow({
                            where: { id: input.role, realm },
                            transaction,
                        }),
                    ]);

                    const assignments = await this.accountRoleAssignmentService.create({
                        input: { account: input.account, roles: [role] },
                        realm: realmEntity,
                        actor,
                        transaction,
                    });

                    return { request: input, actor, realm, assignments };
                },
            });
        } catch (error) {
            if (Exception.isRetryable(error)) {
                throw error;
            } else {
                await this.rejectJoin({
                    request: { actor, realm, input },
                    reason: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }

    public async leave(props: Commands.Membership.Leave.Props): Commands.Membership.Leave.Result {
        const { input, actor, realm } = props;

        try {
            await this.transactionalService.run<Commands.Membership.Leave.ExecuteResult>({
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.leaveAssignmentProjectionPayload,
                        actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.leaveOverrideProjectionPayload,
                        actionType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.leaveAccessCachePayload,
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    },
                    {
                        payloadMapper: this.mapper.leaveConfirmedPayload,
                        actionType: MembershipTopicAction.LEAVE_CONFIRMED,
                        destinationTopic: KafkaTopic.MEMBERSHIP,
                    },
                    {
                        payloadMapper: this.mapper.notificationPayload,
                        actionType: NotificationTopicAction.CREATE,
                        destinationTopic: KafkaTopic.NOTIFICATION,
                    },
                ],
                audit: {
                    entityType: EntityType.ROLE_ASSIGNMENT,
                    actionType: ActionType.DELETE,
                    context: CONSUMER_META,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const [assignments, overrides, realmEntity] = await Promise.all([
                        this.accountRoleAssignmentRepository.find({
                            where: { account: input.account, realm },
                            options: { populate: ["realm", "role"] },
                            transaction,
                        }),
                        this.permissionOverrideRepository.find({
                            where: { account: input.account, realm },
                            options: { populate: ["permission.realm", "realm"] },
                            transaction,
                        }),
                        this.realmRepository.findUniqueOrThrow({
                            where: { id: realm },
                            transaction,
                        }),
                    ]);

                    this.permissionOverrideService.clean({ transaction, entities: overrides });
                    this.accountRoleAssignmentService.clean({ transaction, entities: assignments });

                    return { request: input, actor, realm, assignments, overrides, realmEntity };
                },
            });
        } catch (error) {
            if (Exception.isRetryable(error)) {
                throw error;
            } else {
                await this.rejectLeave({
                    request: { actor, realm, input },
                    reason: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }

    public async rejectJoin(props: Commands.Membership.RejectJoin.Props): Commands.Membership.RejectJoin.Result {
        await this.transactionalService.emit({
            payload: this.mapper.joinRejectedPayload(props),
            actionType: MembershipTopicAction.JOIN_REJECTED,
            destinationTopic: KafkaTopic.MEMBERSHIP,
            resource: this.resource,
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.CREATE,
                context: CONSUMER_META,
                actor: props.request.actor,
                realm: props.request.realm,
                input: props,
            },
        });
    }

    public async rejectLeave(props: Commands.Membership.RejectLeave.Props): Commands.Membership.RejectLeave.Result {
        await this.transactionalService.emit({
            payload: this.mapper.leaveRejectedPayload(props),
            actionType: MembershipTopicAction.LEAVE_REJECTED,
            destinationTopic: KafkaTopic.MEMBERSHIP,
            resource: this.resource,
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.DELETE,
                context: CONSUMER_META,
                actor: props.request.actor,
                realm: props.request.realm,
                input: props,
            },
        });
    }
}
