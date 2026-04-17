import { Inject, Injectable, Scope } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { ROLE_PERMISSION_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";
import {
    ROLE_PERMISSION_ASSIGNMENT_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

import {
    RolePermissionAssignmentRestoredEvent,
    RolePermissionAssignmentCreatedEvent,
    RolePermissionAssignmentRevokedEvent,
    RolePermissionAssignmentPurgedEvent,
} from "../events/role-permission-assignment.events";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentCommands implements Commands.RolePermissionAssignment.Contract {
    private readonly dictionaryPath = "commands.role-permission-assignment";
    private readonly resource = "RolePermissionAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
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
        private readonly eventEmitter: EventEmitter2,
    ) {}

    public async create(
        props: Commands.RolePermissionAssignment.Create.Props,
    ): Promise<Commands.RolePermissionAssignment.Create.Result> {
        const { input, realm } = props;

        const { affected } = await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.PERMISSION_ASSIGNMENT,
                actionType: AccessControlActionType.CREATE,
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
                    await this.rolePermissionAssignmentService.create({
                        input: {
                            permissions: permissionEntities,
                            role: roleEntity,
                        },
                        realm: realmEntity,
                        transaction,
                    });

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: [roleEntity.id],
                        transaction,
                    });

                    return { affected };
                }
            },
        });

        this.eventEmitter.emit(
            RolePermissionAssignmentCreatedEvent.TOKEN,
            new RolePermissionAssignmentCreatedEvent(input.role, realm, input.permissions, affected),
        );

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(
        props: Commands.RolePermissionAssignment.Purge.Props,
    ): Promise<Commands.RolePermissionAssignment.Purge.Result> {
        const { input } = props;

        const count = await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.PERMISSION_ASSIGNMENT,
                actionType: AccessControlActionType.DELETE,
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

                    return entities.length;
                }
            },
        });

        this.eventEmitter.emit(
            RolePermissionAssignmentPurgedEvent.TOKEN,
            new RolePermissionAssignmentPurgedEvent(input.identifiers),
        );

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(
        props: Commands.RolePermissionAssignment.Revoke.Props,
    ): Promise<Commands.RolePermissionAssignment.Revoke.Result> {
        const { input } = props;

        const { entities, affected } = await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.PERMISSION_ASSIGNMENT,
                actionType: AccessControlActionType.REVOKE,
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

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: entities.map(({ role: { id } }) => id),
                    });

                    return { entities, affected };
                }
            },
        });

        this.eventEmitter.emit(
            RolePermissionAssignmentRevokedEvent.TOKEN,
            new RolePermissionAssignmentRevokedEvent(
                entities.map(({ id }) => id),
                affected,
            ),
        );

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

        const { entities, affected } = await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.PERMISSION_ASSIGNMENT,
                actionType: AccessControlActionType.REVOKE,
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

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: entities.map(({ role: { id } }) => id),
                    });

                    return { entities, affected };
                }
            },
        });

        this.eventEmitter.emit(
            RolePermissionAssignmentRestoredEvent.TOKEN,
            new RolePermissionAssignmentRestoredEvent(
                entities.map(({ id }) => id),
                affected,
            ),
        );

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }
}
