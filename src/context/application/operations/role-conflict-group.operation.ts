import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_GROUP_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { ROLE_CONFLICT_GROUP_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { OperationException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupOperation implements Operations.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "commands.role-conflict-group";
    private readonly resource = "RoleConflictGroup";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
        @Inject(ROLE_CONFLICT_GROUP_SERVICE)
        private readonly roleConflictGroupService: Services.RoleConflictGroup.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
    ) {}

    public async create(props: Operations.RoleConflictGroup.Create): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
                        throw OperationException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                    }

                    await this.roleConflictGroupService.create({
                        input: { ...input, members: roleEntities },
                        realm: realmEntity,
                        transaction,
                    });

                    return { message: `${this.dictionaryPath}.CREATED` };
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async update(props: Operations.RoleConflictGroup.Update): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async purge(props: Operations.RoleConflictGroup.Purge): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
                        throw OperationException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                    }

                    this.roleConflictGroupService.purge({ transaction, entities });

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

    public async revoke(props: Operations.RoleConflictGroup.Revoke): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
                        throw OperationException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                    }

                    this.roleConflictGroupService.revoke({ entities });

                    if (entities.length > 1) {
                        return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                    } else {
                        return { message: `${this.dictionaryPath}.REVOKED` };
                    }
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async restore(props: Operations.RoleConflictGroup.Restore): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
                        throw OperationException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
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
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }
}
