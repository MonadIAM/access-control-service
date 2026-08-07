import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessCacheTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { SystemRealm } from "~infrastructure/datasets/realm.dataset";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";
import {
    ROLE_PERMISSION_ASSIGNMENT_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/domain/repositories";

import { ROLE_PERMISSION_ASSIGNMENT_SERVICE } from "../services";
import { RolePermissionAssignmentMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentCommands implements Commands.RolePermissionAssignment.Contract {
    private readonly mapper = new RolePermissionAssignmentMapper();
    private readonly dictionaryPath = "commands.role-permission-assignment";
    private readonly resource = "RolePermissionAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.PublicContract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_SERVICE)
        private readonly rolePermissionAssignmentService: Services.RolePermissionAssignment.CommandContract,
    ) {}

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
                const [realmEntity, roleEntity, permissionEntities] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: input.role, realm },
                        transaction,
                    }),
                    this.permissionRepository.find({
                        where: { id: { $in: input.permissions }, realm: { $in: [realm, SystemRealm.id] } },
                        transaction,
                    }),
                ]);

                if (permissionEntities.length < input.permissions.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.PERMISSIONS_NOT_FOUND` });
                } else {
                    const assignments = await this.rolePermissionAssignmentService.create({
                        input: {
                            permissions: permissionEntities,
                            role: roleEntity,
                        },
                        realm: realmEntity,
                        transaction,
                    });

                    return { assignments };
                }
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
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
                const entities = await this.rolePermissionAssignmentRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
                } else {
                    this.rolePermissionAssignmentService.purge({ transaction, entities });
                    return { assignments: entities };
                }
            },
        });

        if (assignments.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: assignments.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
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
                const entities = await this.rolePermissionAssignmentRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
                } else {
                    this.rolePermissionAssignmentService.revoke({ entities });
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
                const entities = await this.rolePermissionAssignmentRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
                } else {
                    this.rolePermissionAssignmentService.restore({ entities });
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
}
