import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "~context/infrastructure/queues";
import { ROLE_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleHandler implements Handlers.Role.Contract {
    private readonly dictionaryPath = "handlers.role";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(PERMISSION_CACHE_INVALIDATION_QUEUE)
        private readonly permissionCacheInvalidationQueue: Queues.PermissionInvalidation.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(ROLE_SERVICE)
        private readonly roleService: Services.Role.Contract,
    ) {}

    public async create({
        input: { parent, ...input },
        context,
        realm,
        actor,
    }: Handlers.Role.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const [parentEntity, realmEntity] = await Promise.all([
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: parent, realm },
                        transaction,
                    }),
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                ]);

                await this.roleService.create({
                    input: { ...input, actor, parent: parentEntity, realm: realmEntity },
                    transaction,
                    context,
                });

                return { message: `${this.dictionaryPath}.CREATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async update({ input, context, realm, actor, id }: Handlers.Role.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                await this.roleService.update({
                    transaction,
                    context,
                    entity,
                    realm,
                    input,
                    actor,
                });

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async purge({ input, context, realm, actor, id }: Handlers.Role.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                await this.roleService.purge({
                    transaction,
                    ...input,
                    context,
                    entity,
                    realm,
                    actor,
                });

                return { message: `${this.dictionaryPath}.PURGED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async purgeSubtree({ input, context, realm, actor, id }: Handlers.Role.PurgeSubtree): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                const count = await this.roleService.purgeSubtree({
                    transaction,
                    ...input,
                    context,
                    entity,
                    realm,
                    actor,
                });

                return { message: `${this.dictionaryPath}.SUBTREE_PURGED_COUNT`, params: { count } };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async revoke({
        input: { identifiers, reason },
        context,
        realm,
        actor,
    }: Handlers.Role.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { entities, affected } = await writeManager.transactional(async (transaction) => {
                const entities = await this.roleRepository.find({
                    where: { id: { $in: identifiers }, realm },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                }

                await this.roleService.revoke({
                    transaction,
                    entities,
                    context,
                    reason,
                    realm,
                    actor,
                });

                const affected = await this.roleRepository.findAccountsByRoles({
                    roles: entities.map(({ id }) => id),
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
            throw HandlerException.fromOrmError(error);
        }
    }

    public async restore({
        input: { identifiers, reason },
        context,
        realm,
        actor,
    }: Handlers.Role.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { entities, affected } = await writeManager.transactional(async (transaction) => {
                const entities = await this.roleRepository.find({
                    where: { id: { $in: identifiers }, realm },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                }

                await this.roleService.restore({
                    transaction,
                    entities,
                    context,
                    reason,
                    realm,
                    actor,
                });

                const affected = await this.roleRepository.findAccountsByRoles({
                    roles: entities.map(({ id }) => id),
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
            throw HandlerException.fromOrmError(error);
        }
    }
}
