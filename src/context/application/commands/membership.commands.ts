import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE, PERMISSION_OVERRIDE_SERVICE } from "~context/domain/services";
import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { CONSUMER_META } from "~context/constants";
import { Exception } from "~common/exceptions";
import {
    NotificationTopicAction,
    AccessCacheTopicAction,
    MembershipTopicAction,
    ActionType,
    EntityType,
    KafkaTopic,
} from "~context/enums";

import { MembershipMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipCommands implements Commands.Membership.Contract {
    private readonly mapper: Commands.Mappers.Membership.Contract;
    private readonly resource = "Membership";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.CommandContract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.CommandContract,
    ) {
        this.mapper = new MembershipMapper();
    }

    public async join(props: Commands.Membership.Join.Props): Commands.Membership.Join.Result {
        const { incoming, input, actor, realm } = props;

        try {
            await this.transactionalService.consume<Commands.Membership.Join.ExecuteResult>({
                incoming,
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
                    input,
                    actor,
                    realm,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const assignments = await this.accountRoleAssignmentService.ensure({
                        input: { account: input.account, role: input.role },
                        transaction,
                        actor,
                        realm,
                    });

                    return { request: input, actor, realm, assignments };
                },
            });
        } catch (error) {
            if (Exception.isRetryable(error)) {
                throw error;
            } else {
                await this.rejectJoin({
                    incoming,
                    request: { actor, realm, input },
                    reason: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }

    public async rejectJoin(props: Commands.Membership.RejectJoin.Props): Commands.Membership.RejectJoin.Result {
        const { incoming, ...result } = props;

        await this.transactionalService.consume<Commands.Membership.RejectJoin.ExecuteResult>({
            incoming,
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.joinRejectedPayload,
                actionType: MembershipTopicAction.JOIN_REJECTED,
                destinationTopic: KafkaTopic.MEMBERSHIP,
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.CREATE,
                actor: result.request.actor,
                realm: result.request.realm,
                context: CONSUMER_META,
                input: result,
            },
            execute: () => result,
        });
    }

    public async leave(props: Commands.Membership.Leave.Props): Commands.Membership.Leave.Result {
        const { incoming, input, actor, realm } = props;

        try {
            await this.transactionalService.consume<Commands.Membership.Leave.ExecuteResult>({
                incoming,
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
                    input,
                    actor,
                    realm,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const realmEntity = await this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    });

                    const overrides = await this.permissionOverrideService.clean({
                        input: { account: input.account, realm },
                        transaction,
                    });

                    const assignments = await this.accountRoleAssignmentService.clean({
                        input: { account: input.account, realm },
                        transaction,
                    });

                    return { request: input, actor, realm, assignments, overrides, realmEntity };
                },
            });
        } catch (error) {
            if (Exception.isRetryable(error)) {
                throw error;
            } else {
                await this.rejectLeave({
                    incoming,
                    request: { actor, realm, input },
                    reason: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }

    public async rejectLeave(props: Commands.Membership.RejectLeave.Props): Commands.Membership.RejectLeave.Result {
        const { incoming, ...result } = props;

        await this.transactionalService.consume<Commands.Membership.RejectLeave.ExecuteResult>({
            incoming,
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.leaveRejectedPayload,
                actionType: MembershipTopicAction.LEAVE_REJECTED,
                destinationTopic: KafkaTopic.MEMBERSHIP,
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.DELETE,
                actor: result.request.actor,
                realm: result.request.realm,
                context: CONSUMER_META,
                input: result,
            },
            execute: () => result,
        });
    }
}
