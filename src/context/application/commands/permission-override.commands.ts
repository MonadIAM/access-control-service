import { Inject, Injectable, Scope } from "@nestjs/common";
import { AccessCacheTopicAction } from "@monadiam/shared";

import { ActionType, EntityType, InvalidationScope, KafkaTopic } from "~context/enums";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { PERMISSION_OVERRIDE_SERVICE } from "~context/domain/services/tokens";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";
import {
    PERMISSION_OVERRIDE_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
} from "~context/infrastructure/repositories/tokens";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideCommands implements Commands.PermissionOverride.Contract {
    private readonly dictionaryPath = "commands.permission-override";
    private readonly resource = "PermissionOverride";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.Contract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.Contract,
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.Contract,
    ) {}

    public async create(props: Commands.PermissionOverride.Create.Props): Commands.PermissionOverride.Create.Result {
        const { input, realm } = props;

        const isAlreadyMember = await this.projectionCacheService.checkRealm({
            account: input.account,
            realm,
        });

        if (!isAlreadyMember) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ACCOUNT_NOT_MEMBER` });
        }

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_CREATE,
                payloadMapper: ([
                    { permission, account, effect, id },
                ]: Entities.PermissionOverride[]): Scripts.PermissionOverride.Create => ({
                    permissionRealm: permission.realm.id,
                    permission: permission.id,
                    override: id,
                    account,
                    effect,
                    realm,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.PermissionOverride[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const [realmEntity, permissionEntity] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.permissionRepository.findUniqueOrThrow({
                        where: { id: input.permission },
                        transaction,
                    }),
                ]);

                return this.permissionOverrideService
                    .create({
                        input: {
                            permission: permissionEntity,
                            account: input.account,
                            effect: input.effect,
                        },
                        realm: realmEntity,
                        transaction,
                    })
                    .then((override) => [override]);
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(props: Commands.PermissionOverride.Purge.Props): Commands.PermissionOverride.Purge.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                payloadMapper: (entities: Entities.PermissionOverride[]): Scripts.PermissionOverride.Purge => ({
                    items: entities.map(({ realm, account, permission }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        account,
                    })),
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.PermissionOverride[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: ActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.OVERRIDES_NOT_FOUND` });
                } else {
                    this.permissionOverrideService.purge({ transaction, entities });

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

    public async revoke(props: Commands.PermissionOverride.Revoke.Props): Commands.PermissionOverride.Revoke.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
                payloadMapper: (entities: Entities.PermissionOverride[]): Scripts.PermissionOverride.Update => ({
                    items: entities.map(({ id, realm, account, permission, effect }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        override: id,
                        account,
                        effect,
                    })),
                    isRevoked: true,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.PermissionOverride[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.OVERRIDES_NOT_FOUND` });
                } else {
                    this.permissionOverrideService.revoke({ entities });

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

    public async restore(props: Commands.PermissionOverride.Restore.Props): Commands.PermissionOverride.Restore.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
                payloadMapper: (entities: Entities.PermissionOverride[]): Scripts.PermissionOverride.Update => ({
                    items: entities.map(({ id, realm, account, permission, effect }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        override: id,
                        account,
                        effect,
                    })),
                    isRevoked: false,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.PermissionOverride[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.OVERRIDES_NOT_FOUND` });
                } else {
                    this.permissionOverrideService.restore({ entities });

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

    public async clean(props: Commands.PermissionOverride.Clean.Props): Commands.PermissionOverride.Clean.Result {
        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                payloadMapper: (entities: Entities.PermissionOverride[]): Scripts.PermissionOverride.Purge => ({
                    items: entities.map(({ realm, account, permission }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        account,
                    })),
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.PermissionOverride[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            execute: async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { account: props.account },
                    transaction,
                });

                this.permissionOverrideService.purge({ transaction, entities });

                return entities;
            },
        });
    }

    public outboxPayloadMapper(
        entities: Commands.PermissionOverride.OutboxPayloadMapper.Props,
    ): Commands.PermissionOverride.OutboxPayloadMapper.Result {
        return {
            items: entities.map(({ account, realm }) => ({
                scope: InvalidationScope.ACCOUNT_REALM,
                realm: realm.id,
                account,
            })),
        };
    }
}
