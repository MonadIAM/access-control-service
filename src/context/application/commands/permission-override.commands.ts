import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessCacheTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services";
import { PERMISSION_OVERRIDE_SERVICE } from "~context/domain/services";
import { CONSUMER_META, SYSTEM_ACCOUNT_ID } from "~context/constants";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";

import { PermissionOverrideMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideCommands implements Commands.PermissionOverride.Contract {
    private readonly mapper: Commands.Mappers.PermissionOverride.Contract;
    private readonly dictionaryPath = "commands.permission-override";
    private readonly resource = "PermissionOverride";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.PublicContract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.CommandContract,
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.PublicContract,
    ) {
        this.mapper = new PermissionOverrideMapper();
    }

    public async create(props: Commands.PermissionOverride.Create.Props): Commands.PermissionOverride.Create.Result {
        const { input, realm } = props;

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
                        actionType: ProjectionScript.PERMISSION_OVERRIDE_CREATE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.accessCachePayload,
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    },
                ],
                audit: {
                    entityType: EntityType.PERMISSION_OVERRIDE,
                    actionType: ActionType.CREATE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const override = await this.permissionOverrideService.create({ transaction, realm, input });

                    return { overrides: [override] };
                },
            });

            return { message: `${this.dictionaryPath}.CREATED` };
        } else {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ACCOUNT_NOT_MEMBER` });
        }
    }

    public async revoke(props: Commands.PermissionOverride.Revoke.Props): Commands.PermissionOverride.Revoke.Result {
        const { input, realm } = props;

        const { overrides } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const overrides = await this.permissionOverrideService.revoke({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { overrides };
            },
        });

        if (overrides.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: overrides.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.PermissionOverride.Restore.Props): Commands.PermissionOverride.Restore.Result {
        const { input, realm } = props;

        const { overrides } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const overrides = await this.permissionOverrideService.restore({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { overrides };
            },
        });

        if (overrides.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: overrides.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async expire(props: Commands.PermissionOverride.Expire.Props): Commands.PermissionOverride.Expire.Result {
        const now = props.now ?? new Date();
        const overrides = await this.permissionOverrideRepository.find({
            where: { isRevoked: false, expiresAt: { $lte: now } },
            options: { limit: props.batchSize, populate: ["permission.realm"] },
        });

        if (overrides.length) {
            let expired = 0;
            await this.transactionalService.run({
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.projectionUpdatePayload,
                        actionType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
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
                    entityType: EntityType.PERMISSION_OVERRIDE,
                    actionType: ActionType.REVOKE,
                    input: {
                        identifiers: overrides.map(({ id }) => id),
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
                    this.permissionOverrideService.expire({ transaction, entities: overrides });
                    expired = overrides.length;
                    return { overrides };
                },
            });

            return expired;
        } else {
            return 0;
        }
    }

    public async purge(props: Commands.PermissionOverride.Purge.Props): Commands.PermissionOverride.Purge.Result {
        const { input, realm } = props;

        const { overrides } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionPurgePayload,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: ActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const overrides = await this.permissionOverrideService.purge({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { overrides };
            },
        });

        if (overrides.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: overrides.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async clean(props: Commands.PermissionOverride.Clean.Props): Commands.PermissionOverride.Clean.Result {
        await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionPurgePayload,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
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
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: ActionType.DELETE,
                input: {
                    account: props.account,
                },
                context: CONSUMER_META,
            },
            changeLog: true,
            execute: async (transaction) => {
                const overrides = await this.permissionOverrideService.clean({
                    input: { account: props.account },
                    transaction,
                });

                return { overrides };
            },
        });
    }
}
