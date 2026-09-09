import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessCacheTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { PERMISSION_SERVICE } from "~context/domain/services";

import { PermissionMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionCommands implements Commands.Permission.Contract {
    private readonly mapper: Commands.Mappers.Permission.Contract;
    private readonly dictionaryPath = "commands.permission";
    private readonly resource = "Permission";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(PERMISSION_SERVICE)
        private readonly permissionService: Services.Permission.CommandContract,
    ) {
        this.mapper = new PermissionMapper();
    }

    public async create(props: Commands.Permission.Create.Props): Commands.Permission.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.projectionCreatePayload,
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
                const permission = await this.permissionService.create({
                    transaction,
                    realm,
                    input,
                });

                return { permission };
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
                await this.permissionService.update({
                    patch: input.patch,
                    transaction,
                    realm,
                    id,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.Permission.Revoke.Props): Commands.Permission.Revoke.Result {
        const { input, realm } = props;

        const { permissions } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.PERMISSION_UPDATE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
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
                const permissions = await this.permissionService.revoke({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { permissions };
            },
        });

        if (permissions.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: permissions.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Permission.Restore.Props): Commands.Permission.Restore.Result {
        const { input, realm } = props;

        const { permissions } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.PERMISSION_UPDATE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
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
                const permissions = await this.permissionService.restore({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { permissions };
            },
        });

        if (permissions.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: permissions.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.Permission.Purge.Props): Commands.Permission.Purge.Result {
        const { input, realm } = props;

        const { permissions } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionPurgePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.PERMISSION_PURGE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
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
                const permissions = await this.permissionService.purge({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { permissions };
            },
        });

        if (permissions.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: permissions.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }
}
