import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "~context/infrastructure/queues";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { PERMISSION_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionCommand implements Commands.Permission.Contract {
    private readonly dictionaryPath = "commands.permission";
    private readonly resource = "Permission";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(PERMISSION_CACHE_INVALIDATION_QUEUE)
        private readonly permissionCacheInvalidationQueue: Queues.PermissionInvalidation.Contract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(PERMISSION_SERVICE)
        private readonly permissionService: Services.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
    ) {}

    public async create(props: Commands.Permission.Create): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION,
                    actionType: AccessControlActionType.CREATE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm } = props;
                    const realmEntity = await this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    });

                    await this.permissionService.create({
                        realm: realmEntity,
                        transaction,
                        input,
                    });

                    return { message: `${this.dictionaryPath}.CREATED` };
                },
            });
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async update(props: Commands.Permission.Update): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION,
                    actionType: AccessControlActionType.UPDATE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm, id } = props;
                    const entity = await this.permissionRepository.findUniqueOrThrow({
                        where: { id, realm },
                        transaction,
                    });

                    this.permissionService.update({ entity, patch: input.patch });

                    return { message: `${this.dictionaryPath}.UPDATED` };
                },
            });
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async purge(props: Commands.Permission.Purge): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION,
                    actionType: AccessControlActionType.DELETE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm } = props;
                    const entities = await this.permissionRepository.find({
                        where: { id: { $in: input.identifiers }, realm },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                    }

                    this.permissionService.purge({ transaction, entities });

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

    public async revoke(props: Commands.Permission.Revoke): Promise<MessageResult> {
        try {
            const { entities, affected } = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION,
                    actionType: AccessControlActionType.REVOKE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm } = props;
                    const entities = await this.permissionRepository.find({
                        where: { id: { $in: input.identifiers }, realm },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                    }

                    this.permissionService.revoke({ entities });

                    const affected = await this.permissionRepository.findAccountsByPermissions({
                        permissions: entities.map(({ id }) => id),
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

    public async restore(props: Commands.Permission.Restore): Promise<MessageResult> {
        try {
            const { entities, affected } = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION,
                    actionType: AccessControlActionType.RESTORE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm } = props;
                    const entities = await this.permissionRepository.find({
                        where: { id: { $in: input.identifiers }, realm },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                    }

                    this.permissionService.restore({ entities });

                    const affected = await this.permissionRepository.findAccountsByPermissions({
                        permissions: entities.map(({ id }) => id),
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
