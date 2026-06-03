import { Inject, Injectable, Scope } from "@nestjs/common";
import { AccessCacheTopicAction } from "@liam/contracts";

import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories/tokens";
import { ActionType, EntityType, InvalidationScope, KafkaTopic } from "~context/enums";
import { PERMISSION_SERVICE } from "~context/domain/services/tokens";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionCommands implements Commands.Permission.Contract {
    private readonly dictionaryPath = "commands.permission";
    private readonly resource = "Permission";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(PERMISSION_SERVICE)
        private readonly permissionService: Services.Permission.Contract,
    ) {}

    public async create(props: Commands.Permission.Create.Props): Commands.Permission.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_CREATE,
                payloadMapper: (entity: Entities.Permission): Scripts.Permission.Create => ({
                    permission: entity.id,
                    code: entity.code,
                    realm,
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const realmEntity = await this.realmRepository.findUniqueOrThrow({
                    where: { id: realm },
                    transaction,
                });

                return this.permissionService.create({
                    realm: realmEntity,
                    transaction,
                    input,
                });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.Permission.Update.Props): Commands.Permission.Update.Result {
        const { input, realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: ActionType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.permissionRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.permissionService.update({ entity, patch: input.patch });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async purge(props: Commands.Permission.Purge.Props): Commands.Permission.Purge.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_PURGE,
                payloadMapper: (entities: Entities.Permission[]): Scripts.Permission.Purge => ({
                    permissions: entities.map(({ id }) => id),
                    realm,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.Permission[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: ActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                } else {
                    this.permissionService.purge({ transaction, entities });
                    return entities;
                }
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.Permission.Revoke.Props): Commands.Permission.Revoke.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_UPDATE,
                payloadMapper: (entities: Entities.Permission[]): Scripts.Permission.Update => ({
                    permissions: entities.map(({ id }) => id),
                    isRevoked: true,
                    realm,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.Permission[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                } else {
                    this.permissionService.revoke({ entities });

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

    public async restore(props: Commands.Permission.Restore.Props): Commands.Permission.Restore.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_UPDATE,
                payloadMapper: (entities: Entities.Permission[]): Scripts.Permission.Update => ({
                    permissions: entities.map(({ id }) => id),
                    isRevoked: false,
                    realm,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.Permission[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                } else {
                    this.permissionService.restore({ entities });

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

    public outboxPayloadMapper(
        entities: Commands.Permission.OutboxPayloadMapper.Props,
    ): Commands.Permission.OutboxPayloadMapper.Result {
        return {
            items: entities.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
