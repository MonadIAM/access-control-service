import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessCacheTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { ROLE_PERMISSION_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";

import { RolePermissionAssignmentMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentCommands implements Commands.RolePermissionAssignment.Contract {
    private readonly mapper: Commands.Mappers.RolePermissionAssignment.Contract;
    private readonly dictionaryPath = "commands.role-permission-assignment";
    private readonly resource = "RolePermissionAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_SERVICE)
        private readonly rolePermissionAssignmentService: Services.RolePermissionAssignment.CommandContract,
    ) {
        this.mapper = new RolePermissionAssignmentMapper();
    }

    public async create(
        props: Commands.RolePermissionAssignment.Create.Props,
    ): Commands.RolePermissionAssignment.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionCreatePayload,
                    actionType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_CREATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.PERMISSION_ASSIGNMENT,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const assignments = await this.rolePermissionAssignmentService.create({ transaction, realm, input });

                return { assignments };
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async revoke(
        props: Commands.RolePermissionAssignment.Revoke.Props,
    ): Commands.RolePermissionAssignment.Revoke.Result {
        const { input, realm } = props;

        const { assignments } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    actionType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.PERMISSION_ASSIGNMENT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const assignments = await this.rolePermissionAssignmentService.revoke({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { assignments };
            },
        });

        if (assignments.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: assignments.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(
        props: Commands.RolePermissionAssignment.Restore.Props,
    ): Commands.RolePermissionAssignment.Restore.Result {
        const { input, realm } = props;

        const { assignments } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    actionType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.PERMISSION_ASSIGNMENT,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const assignments = await this.rolePermissionAssignmentService.restore({
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

    public async purge(
        props: Commands.RolePermissionAssignment.Purge.Props,
    ): Commands.RolePermissionAssignment.Purge.Result {
        const { input, realm } = props;

        const { assignments } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionPurgePayload,
                    actionType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.PERMISSION_ASSIGNMENT,
                actionType: ActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const assignments = await this.rolePermissionAssignmentService.purge({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { assignments };
            },
        });

        if (assignments.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: assignments.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }
}
