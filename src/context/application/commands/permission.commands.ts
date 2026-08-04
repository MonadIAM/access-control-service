import { Inject, Injectable, Scope } from "@nestjs/common";
import { AccessCacheTopicAction } from "@monadiam/shared";

import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/domain/repositories";
import { ActionType, EntityType, InvalidationScope, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";

import { PERMISSION_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionCommands implements Commands.Permission.Contract {
    private readonly dictionaryPath = "commands.permission";
    private readonly resource = "Permission";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(PERMISSION_SERVICE)
        private readonly permissionService: Services.Permission.CommandContract,
    ) {}

    public async create(props: Commands.Permission.Create.Props): Commands.Permission.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: (entity: Entities.Permission): Scripts.Permission.Create => ({
                    permission: entity.id,
                    code: entity.code,
                    realm,
                }),
                destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                actionType: ProjectionScript.PERMISSION_CREATE,
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
            outbox: [
                {
                    payloadMapper: (entities: Entities.Permission[]): Scripts.Permission.Purge => ({
                        permissions: entities.map(({ id }) => id),
                        realm,
                    }),
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.PERMISSION_PURGE,
                },
                {
                    payloadMapper: this.accessCachePayloadMapper.bind(this),
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
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
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.PERMISSIONS_NOT_FOUND` });
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
            outbox: [
                {
                    payloadMapper: (entities: Entities.Permission[]): Scripts.Permission.Update => ({
                        permissions: entities.map(({ id }) => id),
                        isRevoked: true,
                        realm,
                    }),
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.PERMISSION_UPDATE,
                },
                {
                    payloadMapper: this.accessCachePayloadMapper.bind(this),
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
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
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.PERMISSIONS_NOT_FOUND` });
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
            outbox: [
                {
                    payloadMapper: (entities: Entities.Permission[]): Scripts.Permission.Update => ({
                        permissions: entities.map(({ id }) => id),
                        isRevoked: false,
                        realm,
                    }),
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.PERMISSION_UPDATE,
                },
                {
                    payloadMapper: this.accessCachePayloadMapper.bind(this),
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
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
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.PERMISSIONS_NOT_FOUND` });
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

    public accessCachePayloadMapper(
        entities: Commands.Permission.AccessCachePayloadMapper.Props,
    ): Commands.Permission.AccessCachePayloadMapper.Result {
        return {
            items: entities.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
