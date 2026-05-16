import { Inject, Injectable, Scope } from "@nestjs/common";

import { EventType, EntityType, InvalidationScope, AggregateType, KafkaTopic } from "~context/enums";
import { REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { ROLE_SERVICE } from "~context/domain/services";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleCommands implements Commands.Role.Contract {
    private readonly dictionaryPath = "commands.role";
    private readonly resource = "Role";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(ROLE_SERVICE)
        private readonly roleService: Services.Role.Contract,
    ) {}

    public async create(props: Commands.Role.Create.Props): Commands.Role.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_CREATE,
                payloadMapper: (entity: Entities.Role): Scripts.Role.Create => ({
                    parent: input.parent,
                    role: entity.id,
                    realm,
                }),
            },
            audit: {
                actionType: EventType.CREATE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const [parentEntity, realmEntity] = await Promise.all([
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: input.parent, realm },
                        transaction,
                    }),
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                ]);

                return this.roleService.create({
                    input: { ...input, parent: parentEntity },
                    realm: realmEntity,
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.Role.Update.Props): Commands.Role.Update.Result {
        const { input, realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: EventType.UPDATE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.roleService.update({ entity, patch: input.patch });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async purge(props: Commands.Role.Purge.Props): Commands.Role.Purge.Result {
        const { realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PURGE,
                payloadMapper: ([entity]: Entities.Role[]): Scripts.Role.Purge => ({
                    role: entity.id,
                    realm,
                }),
            },
            outbox: {
                eventType: EventType.DELETE,
                aggregateType: AggregateType.ROLE,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.Role[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            audit: {
                actionType: EventType.DELETE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                await this.roleService.purge({
                    transaction,
                    entity,
                    realm,
                });

                return [entity];
            },
        });

        return { message: `${this.dictionaryPath}.PURGED` };
    }

    public async purgeSubtree(props: Commands.Role.PurgeSubtree.Props): Commands.Role.PurgeSubtree.Result {
        const { realm, id } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PURGE,
                payloadMapper: (): Scripts.Role.Purge => ({
                    role: id,
                    realm,
                }),
            },
            outbox: {
                eventType: EventType.DELETE,
                aggregateType: AggregateType.ROLE,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.Role[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            audit: {
                actionType: EventType.DELETE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                return this.roleService.purgeSubtree({
                    transaction,
                    entity,
                    realm,
                });
            },
        });

        return { message: `${this.dictionaryPath}.SUBTREE_PURGED_COUNT`, params: { count: entities.length } };
    }

    public async revoke(props: Commands.Role.Revoke.Props): Commands.Role.Revoke.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_UPDATE,
                payloadMapper: (entities: Entities.Role[]): Scripts.Role.Update => ({
                    roles: entities.map(({ id }) => id),
                    isRevoked: true,
                    realm,
                }),
            },
            outbox: {
                eventType: EventType.REVOKE,
                aggregateType: AggregateType.ROLE,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.Role[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            audit: {
                actionType: EventType.REVOKE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                } else {
                    this.roleService.revoke({ entities });
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

    public async restore(props: Commands.Role.Restore.Props): Commands.Role.Restore.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_UPDATE,
                payloadMapper: (entities: Entities.Role[]): Scripts.Role.Update => ({
                    roles: entities.map(({ id }) => id),
                    isRevoked: false,
                    realm,
                }),
            },
            outbox: {
                eventType: EventType.RESTORE,
                aggregateType: AggregateType.ROLE,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (entities: Entities.Role[]): Events.AccessCache.Invalidation =>
                    this.outboxPayloadMapper(entities),
            },
            audit: {
                actionType: EventType.RESTORE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                } else {
                    this.roleService.restore({ entities });
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

    public async move(props: Commands.Role.Move.Props): Commands.Role.Move.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_CLOSURE_UPDATE,
                payloadMapper: (steps: Awaited<Services.Role.Move.Result>): Scripts.Role.Move => ({ steps, realm }),
            },
            outbox: {
                eventType: EventType.REPARENT,
                aggregateType: AggregateType.ROLE,
                destinationTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                payloadMapper: (): Events.AccessCache.Invalidation => this.outboxPayloadMapper([{ realm }]),
            },
            audit: {
                actionType: EventType.REPARENT,
                entityType: EntityType.ROLE,
                ...props,
            },
            execute: async (transaction) => {
                const [target, targetParent] = await Promise.all([
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: input.target, realm, isSystemManaged: false },
                        transaction,
                    }),
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: input.targetParent, realm },
                        transaction,
                    }),
                ]);

                return this.roleService.move({ ...input, transaction, targetParent, target, realm });
            },
        });

        return { message: `${this.dictionaryPath}.REPARENTED` };
    }

    public outboxPayloadMapper(
        entities: Commands.Role.OutboxPayloadMapper.Props,
    ): Commands.Role.OutboxPayloadMapper.Result {
        return {
            items: entities.map(({ realm }) => ({
                realm: typeof realm === "string" ? realm : realm.id,
                scope: InvalidationScope.REALM,
            })),
        };
    }
}
