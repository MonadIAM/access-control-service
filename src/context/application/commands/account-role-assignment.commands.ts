import { Inject, Injectable, Scope } from "@nestjs/common";

import { EventType, EntityType, KafkaTopic, AggregateType, InvalidationScope } from "~context/enums";
import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE } from "~context/domain/services/tokens";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { CommandException } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories/tokens";

const SYSTEM_USER_ROLE = "00000002-0000-4000-8000-100000000002";
const SYSTEM_REALM = "00000001-0000-4000-8000-100000000001";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentCommands implements Commands.AccountRoleAssignment.Contract {
    private readonly dictionaryPath = "commands.account-role-assignment";
    private readonly resource = "AccountRoleAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.Contract,
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.Contract,
    ) {}

    public async create(props: Commands.AccountRoleAssignment.Create.Props): Commands.AccountRoleAssignment.Create.Result {
        const { input, actor, realm } = props;

        const isAlreadyMember = await this.projectionCacheService.checkRealm({
            account: input.account,
            realm,
        });

        if (!isAlreadyMember) {
            throw CommandException.conflict(`${this.dictionaryPath}.ACCOUNT_NOT_MEMBER`);
        }

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Create => ({
                    assignments: entities.map(({ id, role }) => ({
                        assignment: id,
                        role: role.id,
                    })),
                    account: input.account,
                    realm,
                }),
            },
            outbox: {
                eventType: EventType.CREATE,
                aggregateType: AggregateType.ROLE_ASSIGNMENT,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: EventType.CREATE,
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
                    throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                } else {
                    return this.accountRoleAssignmentService.create({
                        input: { account: input.account, roles: roleEntities },
                        realm: realmEntity,
                        transaction,
                        actor,
                    });
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
            throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
        }

        const { missing, groups } = await this.projectionCacheService.validateAssignments({
            items: entities.map(({ account, realm, role }) => ({
                realm: realm.id,
                role: role.id,
                account,
            })),
        });

        if (missing.length > 0) {
            throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
        }

        if (groups.some(({ remaining }) => remaining === 0)) {
            throw CommandException.conflict(`${this.dictionaryPath}.CANNOT_PURGE_LAST_ASSIGNMENT`);
        }

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Purge => ({
                    items: entities.map(({ realm, account, role }) => ({
                        realm: realm.id,
                        role: role.id,
                        account,
                    })),
                }),
            },
            outbox: {
                eventType: EventType.DELETE,
                aggregateType: AggregateType.ROLE_ASSIGNMENT,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: EventType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: (transaction) => {
                this.accountRoleAssignmentService.purge({ transaction, entities });
                return entities;
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

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Update => ({
                    isRevoked: true,
                    items: entities.map(({ id, realm, account, role }) => ({
                        realm: realm.id,
                        assignment: id,
                        role: role.id,
                        account,
                    })),
                }),
            },
            outbox: {
                eventType: EventType.REVOKE,
                aggregateType: AggregateType.ROLE_ASSIGNMENT,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: EventType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                } else {
                    this.accountRoleAssignmentService.revoke({ entities });

                    return entities;
                }
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(
        props: Commands.AccountRoleAssignment.Restore.Props,
    ): Commands.AccountRoleAssignment.Restore.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Update => ({
                    isRevoked: false,
                    items: entities.map(({ id, realm, account, role }) => ({
                        realm: realm.id,
                        assignment: id,
                        role: role.id,
                        account,
                    })),
                }),
            },
            outbox: {
                eventType: EventType.RESTORE,
                aggregateType: AggregateType.ROLE_ASSIGNMENT,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: EventType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                } else {
                    this.accountRoleAssignmentService.restore({ entities });

                    return entities;
                }
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async assign(props: Commands.AccountRoleAssignment.Assign.Props): Commands.AccountRoleAssignment.Assign.Result {
        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                payloadMapper: ([entity]: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Create => ({
                    realm: SYSTEM_REALM,
                    account: props.account,
                    assignments: [
                        {
                            assignment: entity.id,
                            role: SYSTEM_USER_ROLE,
                        },
                    ],
                }),
            },
            outbox: {
                eventType: EventType.CREATE,
                aggregateType: AggregateType.ROLE_ASSIGNMENT,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            execute: async (transaction) => {
                const [realmEntity, roleEntity] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: SYSTEM_REALM },
                        transaction,
                    }),
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: SYSTEM_USER_ROLE },
                        transaction,
                    }),
                ]);

                return [
                    this.accountRoleAssignmentService.assign({
                        transaction,
                        input: {
                            account: props.account,
                            realm: realmEntity,
                            role: roleEntity,
                        },
                    }),
                ];
            },
        });
    }

    public async clean(props: Commands.AccountRoleAssignment.Clean.Props): Commands.AccountRoleAssignment.Clean.Result {
        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Purge => ({
                    items: entities.map(({ realm, account, role }) => ({
                        realm: realm.id,
                        role: role.id,
                        account,
                    })),
                }),
            },
            outbox: {
                eventType: EventType.DELETE,
                aggregateType: AggregateType.ROLE_ASSIGNMENT,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            execute: async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { account: props.account },
                    transaction,
                });

                this.accountRoleAssignmentService.purge({ transaction, entities });
                return entities;
            },
        });
    }

    public outboxPayloadMapper(
        entities: Commands.AccountRoleAssignment.OutboxPayloadMapper.Props,
    ): Commands.AccountRoleAssignment.OutboxPayloadMapper.Result {
        return {
            items: entities.map(({ account, realm }) => ({
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            })),
        };
    }
}
