import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ROLE_CONFLICT_GROUP_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_CONFLICT_GROUP_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupHandler implements Handlers.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "handlers.role-conflict-group";
    private readonly resource = "RoleConflictGroup";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
        @Inject(ROLE_CONFLICT_GROUP_SERVICE)
        private readonly roleConflictGroupService: Services.RoleConflictGroup.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
    ) {}

    public async create({
        input: { members, ...input },
        context,
        actor,
        realm,
    }: Handlers.RoleConflictGroup.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const [realmEntity, roleEntities] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.find({
                        where: { id: { $in: members } },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < members.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                }

                await this.roleConflictGroupService.create({
                    input: {
                        members: roleEntities,
                        ...input,
                    },
                    realm: realmEntity,
                    transaction,
                    context,
                    actor,
                });

                return { message: `${this.dictionaryPath}.CREATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async update({ input, context, realm, actor, id }: Handlers.RoleConflictGroup.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleConflictGroupRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                await this.roleConflictGroupService.update({
                    transaction,
                    context,
                    entity,
                    realm,
                    input,
                    actor,
                });

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async purge({
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.RoleConflictGroup.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                await this.roleConflictGroupService.purge({
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
    }: Handlers.RoleConflictGroup.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                await this.roleConflictGroupService.revoke({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.REVOKED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async restore({
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.RoleConflictGroup.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                await this.roleConflictGroupService.restore({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.RESTORED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }
}
