import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_GROUP_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_CONFLICT_GROUP_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { EventType, EntityType } from "~context/enums";
import { CommandException } from "~common/exceptions";

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

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.RoleConflictGroup.Revoke.Props): Promise<Commands.RoleConflictGroup.Revoke.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
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
        props: Commands.RoleConflictGroup.Restore.Props,
    ): Promise<Commands.RoleConflictGroup.Restore.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
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
}
