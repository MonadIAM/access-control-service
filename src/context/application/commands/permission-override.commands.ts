import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_OVERRIDE_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { EventType, EntityType } from "~context/enums";
import { CommandException } from "~common/exceptions";
import {
    PERMISSION_OVERRIDE_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideCommands implements Commands.PermissionOverride.Contract {
    private readonly dictionaryPath = "commands.permission-override";
    private readonly resource = "PermissionOverride";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.InternalContract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.Contract,
    ) {}

    public async create(
        props: Commands.PermissionOverride.Create.Props,
    ): Promise<Commands.PermissionOverride.Create.Result> {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_CREATE,
                payloadMapper: ({ permission, account, version, effect, id }: Entities.PermissionOverride) => ({
                    permissionRealm: permission.realm.id,
                    permission: permission.id,
                    override: id,
                    account,
                    version,
                    effect,
                    realm,
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: EventType.CREATE,
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

                return this.permissionOverrideService.create({
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

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(props: Commands.PermissionOverride.Purge.Props): Promise<Commands.PermissionOverride.Purge.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                payloadMapper: (entities: Entities.PermissionOverride[]) => ({
                    items: entities.map(({ realm, account, permission }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        account,
                    })),
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: EventType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                } else {
                    this.permissionOverrideService.purge({ transaction, entities });

                    return entities;
                }
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(
        props: Commands.PermissionOverride.Revoke.Props,
    ): Promise<Commands.PermissionOverride.Revoke.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
                payloadMapper: (entities: Entities.PermissionOverride[]) => ({
                    items: entities.map(({ id, realm, account, permission, effect, version }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        override: id,
                        version,
                        account,
                        effect,
                    })),
                    isRevoked: true,
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: EventType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                } else {
                    this.permissionOverrideService.revoke({ entities });

                    return entities;
                }
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(
        props: Commands.PermissionOverride.Restore.Props,
    ): Promise<Commands.PermissionOverride.Restore.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
                payloadMapper: (entities: Entities.PermissionOverride[]) => ({
                    items: entities.map(({ id, realm, account, permission, effect, version }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        override: id,
                        version,
                        account,
                        effect,
                    })),
                    isRevoked: false,
                }),
            },
            audit: {
                entityType: EntityType.PERMISSION_OVERRIDE,
                actionType: EventType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.OVERRIDES_NOT_FOUND`);
                } else {
                    this.permissionOverrideService.restore({ entities });

                    return entities;
                }
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async clean(props: Commands.PermissionOverride.Clean.Props): Promise<Commands.PermissionOverride.Clean.Result> {
        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                payloadMapper: (entities: Entities.PermissionOverride[]) => ({
                    items: entities.map(({ realm, account, permission }) => ({
                        permissionRealm: permission.realm.id,
                        permission: permission.id,
                        realm: realm.id,
                        account,
                    })),
                }),
            },
            execute: async (transaction) => {
                const entities = await this.permissionOverrideRepository.find({
                    options: { populate: ["permission.realm"] },
                    where: { account: props.account },
                    transaction,
                });

                this.permissionOverrideService.purge({ transaction, entities });

                return entities;
            },
        });
    }
}
