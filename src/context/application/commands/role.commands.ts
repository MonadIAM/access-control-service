import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessCacheTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { ROLE_SERVICE } from "~context/domain/services";

import { RoleMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RoleCommands implements Commands.Role.Contract {
    private readonly mapper: Commands.Mappers.Role.Contract;
    private readonly dictionaryPath = "commands.role";
    private readonly resource = "Role";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ROLE_SERVICE)
        private readonly roleService: Services.Role.CommandContract,
    ) {
        this.mapper = new RoleMapper();
    }

    public async create(props: Commands.Role.Create.Props): Commands.Role.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.projectionCreatePayload,
                destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                actionType: ProjectionScript.ROLE_CREATE,
            },
            audit: {
                actionType: ActionType.CREATE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.roleService.create({ transaction, realm, input });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.Role.Update.Props): Commands.Role.Update.Result {
        const { input, realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: ActionType.UPDATE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.roleService.update({ patch: input.patch, transaction, realm, id });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async move(props: Commands.Role.Move.Props): Commands.Role.Move.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionMovePayload,
                    actionType: ProjectionScript.ROLE_CLOSURE_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.moveAccessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                actionType: ActionType.REPARENT,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.roleService.move({ ...input, transaction, realm });
            },
        });

        return { message: `${this.dictionaryPath}.REPARENTED` };
    }

    public async revoke(props: Commands.Role.Revoke.Props): Commands.Role.Revoke.Result {
        const { input, realm } = props;

        const { roles } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.ROLE_UPDATE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                actionType: ActionType.REVOKE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const roles = await this.roleService.revoke({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { roles };
            },
        });

        if (roles.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: roles.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Role.Restore.Props): Commands.Role.Restore.Result {
        const { input, realm } = props;

        const { roles } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.ROLE_UPDATE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                actionType: ActionType.RESTORE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const roles = await this.roleService.restore({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { roles };
            },
        });

        if (roles.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: roles.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.Role.Purge.Props): Commands.Role.Purge.Result {
        const { realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionPurgePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.ROLE_PURGE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                actionType: ActionType.DELETE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleService.purge({ transaction, realm, id });

                return { roles: [entity] };
            },
        });

        return { message: `${this.dictionaryPath}.PURGED` };
    }

    public async purgeSubtree(props: Commands.Role.PurgeSubtree.Props): Commands.Role.PurgeSubtree.Result {
        const { realm, id } = props;

        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionSubtreePurgePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.ROLE_PURGE,
                },
                {
                    payloadMapper: this.mapper.subtreeAccessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                actionType: ActionType.DELETE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.roleService.purgeSubtree({ transaction, realm, id });
            },
        });

        return { message: `${this.dictionaryPath}.SUBTREE_PURGED_COUNT`, params: { count: entities.length } };
    }
}
