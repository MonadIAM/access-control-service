import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { PERMISSION_CACHE_SERVICE } from "~context/infrastructure/services";
import { PERMISSION_OVERRIDE_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { OperationException } from "~common/exceptions";
import {
    PERMISSION_OVERRIDE_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideOperation implements Operations.PermissionOverride.Contract {
    private readonly dictionaryPath = "commands.permission-override";
    private readonly resource = "PermissionOverride";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.Contract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.Contract,
        @Inject(PERMISSION_CACHE_SERVICE)
        private readonly permissionCacheService: Services.PermissionCache.Contract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
    ) {}

    public async create(props: Operations.PermissionOverride.Create): Promise<MessageResult> {
        try {
            const { input, realm } = props;
            await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION_OVERRIDE,
                    actionType: AccessControlActionType.CREATE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const [realmEntity, permissionEntity] = await Promise.all([
                        this.realmRepository.findUniqueOrThrow({
                            where: { id: realm },
                            transaction,
                        }),
                        this.permissionRepository.findUniqueOrThrow({
                            where: { id: input.permission },
                            transaction,
                        }),
                    ]);

                    await this.permissionOverrideService.create({
                        input: {
                            permission: permissionEntity,
                            account: input.account,
                            effect: input.effect,
                        },
                        realm: realmEntity,
                        transaction,
                    });
                },
            });

            await this.permissionCacheService.invalidate({ accounts: [input.account] });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async purge(props: Operations.PermissionOverride.Purge): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION_OVERRIDE,
                    actionType: AccessControlActionType.DELETE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.permissionOverrideRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw OperationException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                    }

                    this.permissionOverrideService.purge({ transaction, entities });

                    if (entities.length > 1) {
                        return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                    } else {
                        return { message: `${this.dictionaryPath}.PURGED` };
                    }
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async revoke(props: Operations.PermissionOverride.Revoke): Promise<MessageResult> {
        try {
            const entities = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION_OVERRIDE,
                    actionType: AccessControlActionType.REVOKE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.permissionOverrideRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw OperationException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                    }

                    this.permissionOverrideService.revoke({ entities });

                    return entities;
                },
            });

            await this.permissionCacheService.invalidate({ accounts: entities.map(({ account }) => account) });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.REVOKED` };
            }
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async restore(props: Operations.PermissionOverride.Restore): Promise<MessageResult> {
        try {
            const entities = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.PERMISSION_OVERRIDE,
                    actionType: AccessControlActionType.RESTORE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.permissionOverrideRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw OperationException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                    }

                    this.permissionOverrideService.restore({ entities });

                    return entities;
                },
            });

            await this.permissionCacheService.invalidate({ accounts: entities.map(({ account }) => account) });

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
