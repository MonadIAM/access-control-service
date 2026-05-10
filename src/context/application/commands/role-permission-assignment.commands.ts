import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_PERMISSION_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { EventType, EntityType } from "~context/enums";
import { CommandException } from "~common/exceptions";
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
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.InternalContract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_SERVICE)
        private readonly rolePermissionAssignmentService: Services.RolePermissionAssignment.Contract,
    ) {}

    public async create(
        props: Commands.RolePermissionAssignment.Create.Props,
    ): Promise<Commands.RolePermissionAssignment.Create.Result> {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_CREATE,
                payloadMapper: (entities: Entities.RolePermissionAssignment[]) => ({
                    realm,
                    role: input.role,
                    assignments: entities.map(({ id, permission, version, scope }) => ({
                        assignment: id,
                        permission: permission.id,
                        version,
                        scope,
                    })),
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION_ASSIGNMENT,
                actionType: EventType.CREATE,
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
                        where: { id: input.role },
                        transaction,
                    }),
                    this.permissionRepository.find({
                        where: { id: { $in: input.permissions } },
                        transaction,
                    }),
                ]);

                if (permissionEntities.length < input.permissions.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
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
    ): Promise<Commands.RolePermissionAssignment.Purge.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_PURGE,
                payloadMapper: (entities: Entities.RolePermissionAssignment[]) => ({
                    items: entities.map(({ realm, role, permission }) => ({
                        permission: permission.id,
                        realm: realm.id,
                        role: role.id,
                    })),
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION_ASSIGNMENT,
                actionType: EventType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.rolePermissionAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
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
    ): Promise<Commands.RolePermissionAssignment.Revoke.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE,
                payloadMapper: (entities: Entities.RolePermissionAssignment[]) => ({
                    items: entities.map(({ id, realm, role, permission, version }) => ({
                        permission: permission.id,
                        realm: realm.id,
                        assignment: id,
                        role: role.id,
                        version,
                    })),
                    isRevoked: true,
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION_ASSIGNMENT,
                actionType: EventType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.rolePermissionAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
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
    ): Promise<Commands.RolePermissionAssignment.Restore.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE,
                payloadMapper: (entities: Entities.RolePermissionAssignment[]) => ({
                    items: entities.map(({ id, realm, role, permission, version }) => ({
                        permission: permission.id,
                        realm: realm.id,
                        assignment: id,
                        role: role.id,
                        version,
                    })),
                    isRevoked: false,
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION_ASSIGNMENT,
                actionType: EventType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.rolePermissionAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
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
}
