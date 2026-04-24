import { Inject, Injectable, Scope } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { EventType, EntityType } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ROLE_SERVICE } from "~context/domain/services";
import { CommandException } from "~common/exceptions";

import {
    RoleSubtreePurgedEvent,
    RoleRestoredEvent,
    RoleRevokedEvent,
    RoleUpdatedEvent,
    RoleCreatedEvent,
    RolePurgedEvent,
} from "../events/role.events";

@Injectable({ scope: Scope.DEFAULT })
export class RoleCommands implements Commands.Role.Contract {
    private readonly dictionaryPath = "commands.role";
    private readonly resource = "Role";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ROLE_SERVICE)
        private readonly roleService: Services.Role.Contract,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    public async create(props: Commands.Role.Create.Props): Promise<Commands.Role.Create.Result> {
        const { input, realm } = props;

        const entity = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: EventType.CREATE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
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

                return this.roleService.create({
                    input: { ...input, parent: parentEntity },
                    realm: realmEntity,
                    transaction,
                });
            },
        });

        this.eventEmitter.emit(RoleCreatedEvent.TOKEN, new RoleCreatedEvent(entity.id, realm, input.parent));

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.Role.Update.Props): Promise<Commands.Role.Update.Result> {
        const { input, realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: EventType.UPDATE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.roleService.update({ entity, patch: input.patch });
            },
        });

        this.eventEmitter.emit(RoleUpdatedEvent.TOKEN, new RoleUpdatedEvent(id, realm));

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async purge(props: Commands.Role.Purge.Props): Promise<Commands.Role.Purge.Result> {
        const { realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: EventType.DELETE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                await this.roleService.purge({
                    transaction,
                    entity,
                    realm,
                });
            },
        });

        this.eventEmitter.emit(RolePurgedEvent.TOKEN, new RolePurgedEvent(id, realm));

        return { message: `${this.dictionaryPath}.PURGED` };
    }

    public async purgeSubtree(props: Commands.Role.PurgeSubtree.Props): Promise<Commands.Role.PurgeSubtree.Result> {
        const { realm, id } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: EventType.DELETE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                const count = await this.roleService.purgeSubtree({
                    transaction,
                    entity,
                    realm,
                });

                return { count };
            },
        });

        this.eventEmitter.emit(RoleSubtreePurgedEvent.TOKEN, new RoleSubtreePurgedEvent(id, realm, count));

        return { message: `${this.dictionaryPath}.SUBTREE_PURGED_COUNT`, params: { count } };
    }

    public async revoke(props: Commands.Role.Revoke.Props): Promise<Commands.Role.Revoke.Result> {
        const { input, realm } = props;

        const { entities, affected } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: EventType.REVOKE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                } else {
                    this.roleService.revoke({ entities });

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: entities.map(({ id }) => id),
                    });

                    return { entities, affected };
                }
            },
        });

        this.eventEmitter.emit(
            RoleRevokedEvent.TOKEN,
            new RoleRevokedEvent(
                entities.map(({ id }) => id),
                realm,
                affected,
            ),
        );

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Role.Restore.Props): Promise<Commands.Role.Restore.Result> {
        const { input, realm } = props;

        const { entities, affected } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: EventType.RESTORE,
                entityType: EntityType.ROLE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                } else {
                    this.roleService.restore({ entities });

                    const affected = await this.roleRepository.findAccountsByRoles({
                        roles: entities.map(({ id }) => id),
                    });

                    return { entities, affected };
                }
            },
        });

        this.eventEmitter.emit(
            RoleRestoredEvent.TOKEN,
            new RoleRestoredEvent(
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
