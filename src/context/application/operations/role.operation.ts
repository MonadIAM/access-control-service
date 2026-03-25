import { Inject, Injectable, Scope } from "@nestjs/common";

import { REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "~context/infrastructure/queues";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { ROLE_SERVICE } from "~context/domain/services";
import { OperationException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleOperation implements Operations.Role.Contract {
    private readonly dictionaryPath = "operations.role";
    private readonly resource = "Role";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(PERMISSION_CACHE_INVALIDATION_QUEUE)
        private readonly permissionCacheInvalidationQueue: Queues.PermissionInvalidation.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(ROLE_SERVICE)
        private readonly roleService: Services.Role.Contract,
    ) {}

    public async create(props: Operations.Role.Create): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    actionType: AccessControlActionType.CREATE,
                    entityType: AccessControlEntityType.ROLE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm, actor } = props;
                    const [parentEntity, realmEntity] = await Promise.all([
                        this.roleRepository.findUniqueOrThrow({
                            where: { id: input.parent, realm },
                            transaction,
                        }),
                        this.realmRepository.findUniqueOrThrow({
                            where: { id: realm },
                            transaction,
                        }),
                    ]);

                    await this.roleService.create({
                        input: { ...input, parent: parentEntity },
                        realm: realmEntity,
                        transaction,
                        actor,
                    });

                    return { message: `${this.dictionaryPath}.CREATED` };
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async update(props: Operations.Role.Update): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    actionType: AccessControlActionType.UPDATE,
                    entityType: AccessControlEntityType.ROLE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm, actor, id } = props;
                    const entity = await this.roleRepository.findUniqueOrThrow({
                        where: { id, realm },
                        transaction,
                    });

                    this.roleService.update({
                        input: { ...input, entity },
                        actor,
                    });

                    return { message: `${this.dictionaryPath}.UPDATED` };
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async purge(props: Operations.Role.Purge): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    actionType: AccessControlActionType.DELETE,
                    entityType: AccessControlEntityType.ROLE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm, id } = props;
                    const entity = await this.roleRepository.findUniqueOrThrow({
                        where: { id, realm },
                        transaction,
                    });

                    await this.roleService.purge({
                        input: { ...input, entity },
                        transaction,
                        realm,
                    });

                    return { message: `${this.dictionaryPath}.PURGED` };
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async purgeSubtree(props: Operations.Role.PurgeSubtree): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    actionType: AccessControlActionType.DELETE,
                    entityType: AccessControlEntityType.ROLE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm, id } = props;
                    const entity = await this.roleRepository.findUniqueOrThrow({
                        where: { id, realm },
                        transaction,
                    });

                    const count = await this.roleService.purgeSubtree({
                        input: { ...input, entity },
                        transaction,
                        realm,
                    });

                    return { message: `${this.dictionaryPath}.SUBTREE_PURGED_COUNT`, params: { count } };
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async revoke(props: Operations.Role.Revoke): Promise<MessageResult> {
        try {
            const { entities, affected } = await this.transactional.run({
                audit: {
                    actionType: AccessControlActionType.REVOKE,
                    entityType: AccessControlEntityType.ROLE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm, actor } = props;
                    const entities = await this.roleRepository.find({
                        where: { id: { $in: input.identifiers }, realm },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw OperationException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                    }

                    this.roleService.revoke({
                        input: { entities, reason: input.reason },
                        actor,
                    });

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: entities.map(({ id }) => id),
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
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async restore(props: Operations.Role.Restore): Promise<MessageResult> {
        try {
            const { entities, affected } = await this.transactional.run({
                audit: {
                    actionType: AccessControlActionType.RESTORE,
                    entityType: AccessControlEntityType.ROLE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm, actor } = props;
                    const entities = await this.roleRepository.find({
                        where: { id: { $in: input.identifiers }, realm },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw OperationException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                    }

                    this.roleService.restore({
                        input: { entities, reason: input.reason },
                        actor,
                    });

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: entities.map(({ id }) => id),
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
            throw OperationException.fromOrmError(error, this.resource);
        }
    }
}
