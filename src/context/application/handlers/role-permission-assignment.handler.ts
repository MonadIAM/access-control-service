import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "~context/infrastructure/queues";
import { ROLE_PERMISSION_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";
import {
    ROLE_PERMISSION_ASSIGNMENT_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentHandler implements Handlers.RolePermissionAssignment.Contract {
    private readonly dictionaryPath = "handlers.role-permission-assignment";
    private readonly resource = "RolePermissionAssignment";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
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

    public async create({
        context,
        input,
        realm,
        actor,
    }: Handlers.RolePermissionAssignment.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { affected } = await writeManager.transactional(async (transaction) => {
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
                    throw HandlerException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                }

                await this.rolePermissionAssignmentService.create({
                    input: {
                        permissions: permissionEntities,
                        role: roleEntity,
                    },
                    realm: realmEntity,
                    transaction,
                    context,
                    actor,
                });

                await transaction.flush();

                const affected = await this.roleRepository.findAccountsByRoles({ roles: [roleEntity.id] });

                return { affected };
            });

            await this.permissionCacheInvalidationQueue.add({ accounts: affected });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async purge({ context, input, realm, actor }: Handlers.RolePermissionAssignment.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.rolePermissionAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                }

                this.rolePermissionAssignmentService.purge({
                    input: { entities, reason: input.reason },
                    transaction,
                    context,
                    realm,
                    actor,
                });

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async revoke({
        context,
        input,
        realm,
        actor,
    }: Handlers.RolePermissionAssignment.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { entities, affected } = await writeManager.transactional(async (transaction) => {
                const entities = await this.rolePermissionAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                }

                this.rolePermissionAssignmentService.revoke({
                    input: { entities, reason: input.reason },
                    transaction,
                    context,
                    realm,
                    actor,
                });

                await transaction.flush();

                const affected = await this.roleRepository.findAccountsByRoles({
                    roles: entities.map(({ role: { id } }) => id),
                });

                return { entities, affected };
            });

            await this.permissionCacheInvalidationQueue.add({ accounts: affected });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.REVOKED` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async restore({
        context,
        input,
        realm,
        actor,
    }: Handlers.RolePermissionAssignment.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { entities, affected } = await writeManager.transactional(async (transaction) => {
                const entities = await this.rolePermissionAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                }

                this.rolePermissionAssignmentService.restore({
                    input: { entities, reason: input.reason },
                    transaction,
                    context,
                    realm,
                    actor,
                });

                await transaction.flush();

                const affected = await this.roleRepository.findAccountsByRoles({
                    roles: entities.map(({ role: { id } }) => id),
                });

                return { entities, affected };
            });

            await this.permissionCacheInvalidationQueue.add({ accounts: affected });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.RESTORED` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }
}
