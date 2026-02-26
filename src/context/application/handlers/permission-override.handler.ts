import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { PERMISSION_CACHE_SERVICE } from "~context/infrastructure/services";
import { PERMISSION_OVERRIDE_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";
import {
    PERMISSION_OVERRIDE_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideHandler implements Handlers.PermissionOverride.Contract {
    private readonly dictionaryPath = "handlers.permission-override";
    private readonly resource = "PermissionOverride";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
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

    public async create({
        input: { effect, permission, account },
        context,
        actor,
        realm,
    }: Handlers.PermissionOverride.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const [realmEntity, permissionEntity] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.permissionRepository.findUniqueOrThrow({
                        where: { id: permission },
                        transaction,
                    }),
                ]);

                await this.permissionOverrideService.create({
                    input: {
                        permission: permissionEntity,
                        account,
                        effect,
                    },
                    realm: realmEntity,
                    transaction,
                    context,
                    actor,
                });
            });

            await this.permissionCacheService.invalidate({ accounts: [account] });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async purge({
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.PermissionOverride.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                }

                await this.permissionOverrideService.purge({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

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
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.PermissionOverride.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const entities = await writeManager.transactional(async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                }

                await this.permissionOverrideService.revoke({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

                return entities;
            });

            await this.permissionCacheService.invalidate({ accounts: entities.map(({ account }) => account) });

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
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.PermissionOverride.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const entities = await writeManager.transactional(async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                }

                await this.permissionOverrideService.restore({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

                return entities;
            });

            await this.permissionCacheService.invalidate({ accounts: entities.map(({ account }) => account) });

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
