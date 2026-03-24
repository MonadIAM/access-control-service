import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "~context/infrastructure/queues";
import { ROLE_SERVICE } from "~context/domain/services";
import { OperationException } from "~common/exceptions";
import { AuditJournal } from "~context/domain/entities";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RoleOperation implements Operations.Role.Contract {
    private readonly entityType = AccessControlEntityType.ROLE;
    private readonly dictionaryPath = "operations.role";

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

    public async create({ context, input, realm, actor }: Operations.Role.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
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

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.CREATE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.CREATED` };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async update({ context, input, realm, actor, id }: Operations.Role.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.roleService.update({
                    input: { ...input, entity },
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.UPDATE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async purge({ context, input, realm, actor, id }: Operations.Role.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                await this.roleService.purge({
                    input: { ...input, entity },
                    transaction,
                    realm,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.DELETE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.PURGED` };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async purgeSubtree({ context, input, realm, actor, id }: Operations.Role.PurgeSubtree): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                const count = await this.roleService.purgeSubtree({
                    input: { ...input, entity },
                    transaction,
                    realm,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.DELETE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.SUBTREE_PURGED_COUNT`, params: { count } };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async revoke({ context, input, realm, actor }: Operations.Role.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { entities, affected } = await writeManager.transactional(async (transaction) => {
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

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.REVOKE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

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
            throw OperationException.fromOrmError(error);
        }
    }

    public async restore({ context, input, realm, actor }: Operations.Role.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { entities, affected } = await writeManager.transactional(async (transaction) => {
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

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.RESTORE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

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
            throw OperationException.fromOrmError(error);
        }
    }
}
