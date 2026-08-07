import { Inject, Injectable, Scope } from "@nestjs/common";

import { NotificationTopicAction, AccessCacheTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/domain/repositories";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services";
import { SYSTEM_USER_ROLE_ID, SYSTEM_REALM_ID } from "~context/constants";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";

import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE } from "../services";
import { AccountRoleAssignmentMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentCommands implements Commands.AccountRoleAssignment.Contract {
    private readonly mapper: Commands.Mappers.AccountRoleAssignment.Contract;
    private readonly dictionaryPath = "commands.account-role-assignment";
    private readonly resource = "AccountRoleAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.CommandContract,
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.PublicContract,
    ) {
        this.mapper = new AccountRoleAssignmentMapper();
    }

    public async create(props: Commands.AccountRoleAssignment.Create.Props): Commands.AccountRoleAssignment.Create.Result {
        const { input, actor, realm } = props;

        const isAlreadyMember = await this.projectionCacheService.checkRealm({
            account: input.account,
            realm,
        });

        if (!isAlreadyMember) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ACCOUNT_NOT_MEMBER` });
        }

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
                const [realmEntity, roleEntities] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.find({
                        where: { id: { $in: input.roles }, realm },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < input.roles.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ROLES_NOT_FOUND` });
                } else {
                    const assignments = await this.accountRoleAssignmentService.create({
                        input: { account: input.account, roles: roleEntities },
                        realm: realmEntity,
                        transaction,
                        actor,
                    });

                    return { assignments };
                }
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(props: Commands.AccountRoleAssignment.Purge.Props): Commands.AccountRoleAssignment.Purge.Result {
        const { input, realm } = props;

        const entities = await this.accountRoleAssignmentRepository.find({
            where: { id: { $in: input.identifiers }, realm },
        });

        if (entities.length < input.identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
        }

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

    public async revoke(props: Commands.AccountRoleAssignment.Revoke.Props): Commands.AccountRoleAssignment.Revoke.Result {
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
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    options: { populate: ["realm", "role"] },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
                } else {
                    this.accountRoleAssignmentService.revoke({ entities });

                    return { assignments: entities };
                }
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
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
                } else {
                    this.accountRoleAssignmentService.restore({ entities });

                    return { assignments: entities };
                }
            },
        });

        if (assignments.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: assignments.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async assign(props: Commands.AccountRoleAssignment.Assign.Props): Commands.AccountRoleAssignment.Assign.Result {
        await this.transactionalService.run({
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
            execute: async (transaction) => {
                const [realmEntity, roleEntity] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: SYSTEM_REALM_ID },
                        transaction,
                    }),
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: SYSTEM_USER_ROLE_ID },
                        transaction,
                    }),
                ]);

                return {
                    assignments: [
                        this.accountRoleAssignmentService.assign({
                            transaction,
                            input: {
                                account: props.account,
                                realm: realmEntity,
                                role: roleEntity,
                            },
                        }),
                    ],
                };
            },
        });
    }

    public async clean(props: Commands.AccountRoleAssignment.Clean.Props): Commands.AccountRoleAssignment.Clean.Result {
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
            execute: async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { account: props.account },
                    transaction,
                });

                this.accountRoleAssignmentService.purge({ transaction, entities });

                return { assignments: entities };
            },
        });
    }
}
