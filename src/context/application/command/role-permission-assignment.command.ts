import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "~context/infrastructure/queues";
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

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentCommand implements Commands.RolePermissionAssignment.Contract {
    private readonly dictionaryPath = "commands.role-permission-assignment";
    private readonly resource = "RolePermissionAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.Contract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_SERVICE)
        private readonly rolePermissionAssignmentService: Services.RolePermissionAssignment.Contract,
        @Inject(PERMISSION_CACHE_INVALIDATION_QUEUE)
        private readonly permissionCacheInvalidationQueue: Queues.PermissionInvalidation.Contract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
    ) {}

    public async create(props: Commands.RolePermissionAssignment.Create): Promise<MessageResult> {
        try {
            const { affected } = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION_ASSIGNMENT,
                    actionType: AccessControlActionType.CREATE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm } = props;
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
                    }

                    await this.rolePermissionAssignmentService.create({
                        input: {
                            permissions: permissionEntities,
                            role: roleEntity,
                        },
                        realm: realmEntity,
                        transaction,
                    });

                    const affected = await this.roleRepository.findAccountsByRoles({ roles: [roleEntity.id] });

                    return { affected };
                },
            });

            await this.permissionCacheInvalidationQueue.add({ accounts: affected });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async purge(props: Commands.RolePermissionAssignment.Purge): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION_ASSIGNMENT,
                    actionType: AccessControlActionType.DELETE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.rolePermissionAssignmentRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                    }

                    this.rolePermissionAssignmentService.purge({ transaction, entities });

                    if (entities.length > 1) {
                        return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                    } else {
                        return { message: `${this.dictionaryPath}.PURGED` };
                    }
                },
            });
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async revoke(props: Commands.RolePermissionAssignment.Revoke): Promise<MessageResult> {
        try {
            const { entities, affected } = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION_ASSIGNMENT,
                    actionType: AccessControlActionType.REVOKE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.rolePermissionAssignmentRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                    }

                    this.rolePermissionAssignmentService.revoke({ entities });

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: entities.map(({ role: { id } }) => id),
                    });

                    return { entities, affected };
                },
            });

            await this.permissionCacheInvalidationQueue.add({ accounts: affected });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.REVOKED` };
            }
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async restore(props: Commands.RolePermissionAssignment.Restore): Promise<MessageResult> {
        try {
            const { entities, affected } = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION_ASSIGNMENT,
                    actionType: AccessControlActionType.REVOKE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.rolePermissionAssignmentRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                    }

                    this.rolePermissionAssignmentService.restore({ entities });

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: entities.map(({ role: { id } }) => id),
                    });

                    return { entities, affected };
                },
            });

            await this.permissionCacheInvalidationQueue.add({ accounts: affected });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.RESTORED` };
            }
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }
}
