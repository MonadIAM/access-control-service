import { Inject, Injectable, Scope } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { ROLE_CONFLICT_GROUP_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { EventType, EntityType } from "~context/enums";
import { ROLE_CONFLICT_GROUP_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CommandException } from "~common/exceptions";

import {
    RoleConflictGroupCreatedEvent,
    RoleConflictGroupUpdatedEvent,
    RoleConflictGroupPurgedEvent,
    RoleConflictGroupRevokedEvent,
    RoleConflictGroupRestoredEvent,
} from "../events/role-conflict-group.events";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupCommands implements Commands.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "commands.role-conflict-group";
    private readonly resource = "RoleConflictGroup";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ROLE_CONFLICT_GROUP_SERVICE)
        private readonly roleConflictGroupService: Services.RoleConflictGroup.Contract,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    public async create(props: Commands.RoleConflictGroup.Create.Props): Promise<Commands.RoleConflictGroup.Create.Result> {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: EventType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const [realmEntity, roleEntities] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.find({
                        where: { id: { $in: input.members } },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < input.members.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                } else {
                    await this.roleConflictGroupService.create({
                        input: { ...input, members: roleEntities },
                        realm: realmEntity,
                        transaction,
                    });
                }
            },
        });

        this.eventEmitter.emit(
            RoleConflictGroupCreatedEvent.TOKEN,
            new RoleConflictGroupCreatedEvent(realm, input.members),
        );

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.RoleConflictGroup.Update.Props): Promise<Commands.RoleConflictGroup.Update.Result> {
        const { input, realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: EventType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleConflictGroupRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.roleConflictGroupService.update({ entity, patch: input.patch });
            },
        });

        this.eventEmitter.emit(RoleConflictGroupUpdatedEvent.TOKEN, new RoleConflictGroupUpdatedEvent(id, realm));

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async purge(props: Commands.RoleConflictGroup.Purge.Props): Promise<Commands.RoleConflictGroup.Purge.Result> {
        const { input } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: EventType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                } else {
                    this.roleConflictGroupService.purge({ transaction, entities });
                    return { count: entities.length };
                }
            },
        });

        this.eventEmitter.emit(RoleConflictGroupPurgedEvent.TOKEN, new RoleConflictGroupPurgedEvent(input.identifiers));

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.RoleConflictGroup.Revoke.Props): Promise<Commands.RoleConflictGroup.Revoke.Result> {
        const { input } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: EventType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                } else {
                    this.roleConflictGroupService.revoke({ entities });
                    return { count: entities.length };
                }
            },
        });

        this.eventEmitter.emit(RoleConflictGroupRevokedEvent.TOKEN, new RoleConflictGroupRevokedEvent(input.identifiers));

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(
        props: Commands.RoleConflictGroup.Restore.Props,
    ): Promise<Commands.RoleConflictGroup.Restore.Result> {
        const { input } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: EventType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                } else {
                    this.roleConflictGroupService.restore({ entities });
                    return { count: entities.length };
                }
            },
        });

        this.eventEmitter.emit(RoleConflictGroupRestoredEvent.TOKEN, new RoleConflictGroupRestoredEvent(input.identifiers));

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }
}
