import { Inject, Injectable, Scope } from "@nestjs/common";
import { AccessCacheTopicAction } from "@liam/contracts";

import { ActionType, EntityType, InvalidationScope, KafkaTopic } from "~context/enums";
import { ROLE_PERMISSION_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { SystemRealm } from "~infrastructure/datasets/realm.dataset";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";
import {
    ROLE_PERMISSION_ASSIGNMENT_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentCommands implements Commands.RolePermissionAssignment.Contract {
    private readonly dictionaryPath = "commands.role-permission-assignment";
    private readonly resource = "RolePermissionAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.Contract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_SERVICE)
        private readonly rolePermissionAssignmentService: Services.RolePermissionAssignment.Contract,
    ) {}

    public async create(
        props: Commands.RolePermissionAssignment.Create.Props,
    ): Commands.RolePermissionAssignment.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_CREATE,
                payloadMapper: (
                    entities: Entities.RolePermissionAssignment[],
                ): Scripts.RolePermissionAssignment.Create => ({
                    assignments: entities.map(({ id, permission, scope }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        assignment: id,
                        scope,
                    })),
                    role: input.role,
                    realm,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.RolePermissionAssignment[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
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
                    return this.rolePermissionAssignmentService.create({
                        input: {
                            permissions: permissionEntities,
                            role: roleEntity,
                        },
                        realm: realmEntity,
                        transaction,
                    });
                }
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(
        props: Commands.RolePermissionAssignment.Purge.Props,
    ): Commands.RolePermissionAssignment.Purge.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_PURGE,
                payloadMapper: (entities: Entities.RolePermissionAssignment[]): Scripts.RolePermissionAssignment.Purge => ({
                    items: entities.map(({ realm, role, permission }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        role: role.id,
                    })),
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.RolePermissionAssignment[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
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

    public async revoke(
        props: Commands.RolePermissionAssignment.Revoke.Props,
    ): Commands.RolePermissionAssignment.Revoke.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE,
                payloadMapper: (
                    entities: Entities.RolePermissionAssignment[],
                ): Scripts.RolePermissionAssignment.Update => ({
                    items: entities.map(({ id, realm, role, permission }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        assignment: id,
                        role: role.id,
                    })),
                    isRevoked: true,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.RolePermissionAssignment[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
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
        props: Commands.RolePermissionAssignment.Restore.Props,
    ): Commands.RolePermissionAssignment.Restore.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE,
                payloadMapper: (
                    entities: Entities.RolePermissionAssignment[],
                ): Scripts.RolePermissionAssignment.Update => ({
                    items: entities.map(({ id, realm, role, permission }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        assignment: id,
                        role: role.id,
                    })),
                    isRevoked: false,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.RolePermissionAssignment[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
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
        entities: Commands.RolePermissionAssignment.OutboxPayloadMapper.Props,
    ): Commands.RolePermissionAssignment.OutboxPayloadMapper.Result {
        return {
            items: entities.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
