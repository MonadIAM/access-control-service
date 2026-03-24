import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "~context/infrastructure/queues";
import { PERMISSION_SERVICE } from "~context/domain/services";
import { OperationException } from "~common/exceptions";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AuditJournal } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOperation implements Operations.Permission.Contract {
    private readonly entityType = AccessControlEntityType.PERMISSION;
    private readonly dictionaryPath = "operations.permission";
    private readonly resource = "Permission";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(PERMISSION_CACHE_INVALIDATION_QUEUE)
        private readonly permissionCacheInvalidationQueue: Queues.PermissionInvalidation.Contract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(PERMISSION_SERVICE)
        private readonly permissionService: Services.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
    ) {}

    public async create({ context, input, realm, actor }: Operations.Permission.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const realmEntity = await this.realmRepository.findUniqueOrThrow({
                    where: { id: realm },
                    transaction,
                });

                this.permissionService.create({
                    realm: realmEntity,
                    transaction,
                    input,
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
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async update({ context, input, realm, actor, id }: Operations.Permission.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.permissionRepository.findUniqueOrThrow({
                    where: { id },
                    transaction,
                });

                this.permissionService.update({
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
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async purge({ context, input, realm, actor }: Operations.Permission.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                }

                this.permissionService.purge({
                    input: { ...input, entities },
                    transaction,
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

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async revoke({ context, input, realm, actor }: Operations.Permission.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { entities, affected } = await writeManager.transactional(async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                }

                this.permissionService.revoke({
                    input: { ...input, entities },
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

                const affected = await this.permissionRepository.findAccountsByPermissions({
                    permissions: entities.map(({ id }) => id),
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
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async restore({ context, input, realm, actor }: Operations.Permission.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const { entities, affected } = await writeManager.transactional(async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                }

                this.permissionService.restore({
                    input: { ...input, entities },
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

                const affected = await this.permissionRepository.findAccountsByPermissions({
                    permissions: entities.map(({ id }) => id),
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
            throw OperationException.fromOrmError(error, this.resource);
        }
    }
}
