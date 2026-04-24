import { Inject, Injectable, Scope } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { EventType, EntityType } from "~context/enums";
import { PERMISSION_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CommandException } from "~common/exceptions";

import {
    PermissionRestoredEvent,
    PermissionRevokedEvent,
    PermissionCreatedEvent,
    PermissionUpdatedEvent,
    PermissionPurgedEvent,
} from "../events/permission.events";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionCommands implements Commands.Permission.Contract {
    private readonly dictionaryPath = "commands.permission";
    private readonly resource = "Permission";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(PERMISSION_SERVICE)
        private readonly permissionService: Services.Permission.Contract,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    public async create(props: Commands.Permission.Create.Props): Promise<Commands.Permission.Create.Result> {
        const { input, realm } = props;

        const entity = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: EventType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const realmEntity = await this.realmRepository.findUniqueOrThrow({
                    where: { id: realm },
                    transaction,
                });

                return this.permissionService.create({
                    realm: realmEntity,
                    transaction,
                    input,
                });
            },
        });

        this.eventEmitter.emit(PermissionCreatedEvent.TOKEN, new PermissionCreatedEvent(entity.id, realm));

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.Permission.Update.Props): Promise<Commands.Permission.Update.Result> {
        const { input, realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: EventType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.permissionRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.permissionService.update({ entity, patch: input.patch });
            },
        });

        this.eventEmitter.emit(PermissionUpdatedEvent.TOKEN, new PermissionUpdatedEvent(id, realm));

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async purge(props: Commands.Permission.Purge.Props): Promise<Commands.Permission.Purge.Result> {
        const { input, realm } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: EventType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                } else {
                    this.permissionService.purge({ transaction, entities });
                    return { count: entities.length };
                }
            },
        });

        this.eventEmitter.emit(PermissionPurgedEvent.TOKEN, new PermissionPurgedEvent(input.identifiers, realm));

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.Permission.Revoke.Props): Promise<Commands.Permission.Revoke.Result> {
        const { input, realm } = props;

        const { entities, affected } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: EventType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                } else {
                    this.permissionService.revoke({ entities });

                    const affected = await this.permissionRepository.findAccountsByPermissions({
                        permissions: entities.map(({ id }) => id),
                    });

                    return { entities, affected };
                }
            },
        });

        this.eventEmitter.emit(
            PermissionRevokedEvent.TOKEN,
            new PermissionRevokedEvent(
                entities.map(({ id }) => id),
                props.realm,
                affected,
            ),
        );

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Permission.Restore.Props): Promise<Commands.Permission.Restore.Result> {
        const { input, realm } = props;

        const { entities, affected } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PERMISSION,
                actionType: EventType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.permissionRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.PERMISSIONS_NOT_FOUND`);
                } else {
                    this.permissionService.restore({ entities });

                    const affected = await this.permissionRepository.findAccountsByPermissions({
                        permissions: entities.map(({ id }) => id),
                    });

                    return { entities, affected };
                }
            },
        });

        this.eventEmitter.emit(
            PermissionRestoredEvent.TOKEN,
            new PermissionRestoredEvent(
                entities.map(({ id }) => id),
                realm,
                affected,
            ),
        );

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }
}
