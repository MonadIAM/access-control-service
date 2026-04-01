import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_GROUP_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { ROLE_CONFLICT_GROUP_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupCommands implements Commands.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "commands.role-conflict-group";
    private readonly resource = "RoleConflictGroup";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ROLE_CONFLICT_GROUP_SERVICE)
        private readonly roleConflictGroupService: Services.RoleConflictGroup.Contract,
    ) {}

    public async create(props: Commands.RoleConflictGroup.Create): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.CONFLICT_GROUP,
                actionType: AccessControlActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input, realm } = props;
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
                }

                await this.roleConflictGroupService.create({
                    input: { ...input, members: roleEntities },
                    realm: realmEntity,
                    transaction,
                });

                return { message: `${this.dictionaryPath}.CREATED` };
            },
        });
    }

    public async update(props: Commands.RoleConflictGroup.Update): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.CONFLICT_GROUP,
                actionType: AccessControlActionType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input, realm, id } = props;
                const entity = await this.roleConflictGroupRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.roleConflictGroupService.update({ entity, patch: input.patch });

                return { message: `${this.dictionaryPath}.UPDATED` };
            },
        });
    }

    public async purge(props: Commands.RoleConflictGroup.Purge): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.CONFLICT_GROUP,
                actionType: AccessControlActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input } = props;
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                this.roleConflictGroupService.purge({ transaction, entities });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            },
        });
    }

    public async revoke(props: Commands.RoleConflictGroup.Revoke): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.CONFLICT_GROUP,
                actionType: AccessControlActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input } = props;
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                this.roleConflictGroupService.revoke({ entities });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.REVOKED` };
                }
            },
        });
    }

    public async restore(props: Commands.RoleConflictGroup.Restore): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.CONFLICT_GROUP,
                actionType: AccessControlActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input } = props;
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                this.roleConflictGroupService.restore({ entities });

                if (entities.length > 1) {
                    return {
                        message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`,
                        params: { count: entities.length },
                    };
                } else {
                    return { message: `${this.dictionaryPath}.RESTORED` };
                }
            },
        });
    }
}
