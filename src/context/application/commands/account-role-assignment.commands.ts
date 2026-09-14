import { Inject, Injectable, Scope } from "@nestjs/common";

import { NotificationTopicAction, AccessCacheTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { CONSUMER_META, SYSTEM_ACCOUNT_ID, SYSTEM_USER_ROLE_ID, SYSTEM_REALM_ID } from "~context/constants";
import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE, PERMISSION_OVERRIDE_SERVICE } from "~context/domain/services";
import { ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";

import { AccountRoleAssignmentMapper, PermissionOverrideMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentCommands implements Commands.AccountRoleAssignment.Contract {
    private readonly mapper: Commands.Mappers.AccountRoleAssignment.Contract;
    private readonly permissionOverrideMapper: Commands.Mappers.PermissionOverride.Contract;
    private readonly dictionaryPath = "commands.account-role-assignment";
    private readonly resource = "AccountRoleAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.CommandContract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.CommandContract,
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.PublicContract,
    ) {
        this.mapper = new AccountRoleAssignmentMapper();
        this.permissionOverrideMapper = new PermissionOverrideMapper();
    }

    public async create(props: Commands.AccountRoleAssignment.Create.Props): Commands.AccountRoleAssignment.Create.Result {
        const { input, actor, realm } = props;

        const isAlreadyMember = await this.projectionCacheService.checkRealm({
            account: input.account,
            realm,
        });

        if (isAlreadyMember) {
            await this.transactionalService.run({
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.projectionCreatePayload,
                        actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.notificationGrantPayload,
                        actionType: NotificationTopicAction.CREATE,
                        destinationTopic: KafkaTopic.NOTIFICATION,
                    },
                    {
                        payloadMapper: this.mapper.accessCachePayload,
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    },
                ],
                audit: {
                    entityType: EntityType.ROLE_ASSIGNMENT,
                    actionType: ActionType.CREATE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const assignments = await this.accountRoleAssignmentService.create({
                        input: {
                            justification: input.justification,
                            expiresAt: input.expiresAt,
                            account: input.account,
                            roles: input.roles,
                        },
                        transaction,
                        realm,
                        actor,
                    });

                    return { assignments, actor };
                },
            });

            return { message: `${this.dictionaryPath}.CREATED` };
        } else {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ACCOUNT_NOT_MEMBER` });
        }
    }

    public async assign(props: Commands.AccountRoleAssignment.Assign.Props): Commands.AccountRoleAssignment.Assign.Result {
        const { incoming, account } = props;

        await this.transactionalService.consume({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionAssignPayload,
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.CREATE,
                actor: SYSTEM_ACCOUNT_ID,
                context: CONSUMER_META,
                realm: SYSTEM_REALM_ID,
                input: {
                    role: SYSTEM_USER_ROLE_ID,
                    realm: SYSTEM_REALM_ID,
                    account,
                },
            },
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                const assignment = await this.accountRoleAssignmentService.assign({
                    transaction,
                    input: {
                        role: SYSTEM_USER_ROLE_ID,
                        realm: SYSTEM_REALM_ID,
                        account,
                    },
                });

                return { assignments: [assignment] };
            },
        });
    }

    public async revoke(props: Commands.AccountRoleAssignment.Revoke.Props): Commands.AccountRoleAssignment.Revoke.Result {
        const { input, realm, actor } = props;

        const { assignments } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.mapper.notificationRevokePayload,
                    actionType: NotificationTopicAction.CREATE,
                    destinationTopic: KafkaTopic.NOTIFICATION,
                },
            ],
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const assignments = await this.accountRoleAssignmentService.revoke({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { assignments, actor };
            },
        });

        if (assignments.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: assignments.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(
        props: Commands.AccountRoleAssignment.Restore.Props,
    ): Commands.AccountRoleAssignment.Restore.Result {
        const { input, realm } = props;

        const { assignments } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const assignments = await this.accountRoleAssignmentService.restore({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { assignments };
            },
        });

        if (assignments.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: assignments.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async expire(props: Commands.AccountRoleAssignment.Expire.Props): Commands.AccountRoleAssignment.Expire.Result {
        const now = props.now ?? new Date();
        const assignments = await this.accountRoleAssignmentRepository.find({
            where: { isRevoked: false, expiresAt: { $lte: now } },
            options: { limit: props.batchSize },
        });

        if (assignments.length) {
            let expired = 0;
            await this.transactionalService.run({
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.projectionUpdatePayload,
                        actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.accessCachePayload,
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    },
                ],
                audit: {
                    actor: SYSTEM_ACCOUNT_ID,
                    entityType: EntityType.ROLE_ASSIGNMENT,
                    actionType: ActionType.REVOKE,
                    input: {
                        identifiers: assignments.map(({ id }) => id),
                        expiresAt: now.toISOString(),
                        reason: "expired",
                    },
                    context: {
                        userAgent: "scheduler",
                        ip: "127.0.0.1",
                    },
                },
                changeLog: true,
                execute: (transaction) => {
                    this.accountRoleAssignmentService.expire({ transaction, entities: assignments });
                    expired = assignments.length;
                    return { assignments };
                },
            });

            return expired;
        } else {
            return 0;
        }
    }

    public async purge(props: Commands.AccountRoleAssignment.Purge.Props): Commands.AccountRoleAssignment.Purge.Result {
        const { input, realm } = props;

        const entities = await this.accountRoleAssignmentRepository.find({
            where: { id: { $in: input.identifiers }, realm },
        });

        if (entities.length < input.identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
        } else {
            const { missing, groups } = await this.projectionCacheService.validateAssignments({
                items: entities.map(({ account, realm, role }) => ({
                    realm: realm.id,
                    role: role.id,
                    account,
                })),
            });

            if (missing.length > 0) {
                throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
            }

            if (groups.some(({ remaining }) => remaining === 0)) {
                throw Exception.conflict({ messageKey: `${this.dictionaryPath}.CANNOT_PURGE_LAST_ASSIGNMENT` });
            }

            await this.transactionalService.run({
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.projectionPurgePayload,
                        actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.accessCachePayload,
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    },
                ],
                audit: {
                    entityType: EntityType.ROLE_ASSIGNMENT,
                    actionType: ActionType.DELETE,
                    ...props,
                },
                changeLog: true,
                execute: (transaction) => {
                    this.accountRoleAssignmentService.purge({ transaction, entities });
                    return { assignments: entities };
                },
            });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.PURGED` };
            }
        }
    }

    public async clean(props: Commands.AccountRoleAssignment.Clean.Props): Commands.AccountRoleAssignment.Clean.Result {
        const { incoming, account } = props;

        await this.transactionalService.consume<Commands.AccountRoleAssignment.Clean.ExecuteResult>({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionPurgePayload,
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.permissionOverrideMapper.projectionPurgePayload,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.cleanAccessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.DELETE,
                actor: SYSTEM_ACCOUNT_ID,
                context: CONSUMER_META,
                input: { account },
            },
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                const assignments = await this.accountRoleAssignmentService.clean({
                    input: { account },
                    transaction,
                });
                const overrides = await this.permissionOverrideService.clean({
                    input: { account },
                    transaction,
                });

                return { assignments, overrides };
            },
        });
    }
}
