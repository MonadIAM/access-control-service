import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ROLE_CONFLICT_GROUP_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_CONFLICT_GROUP_SERVICE } from "~context/domain/services";
import { OperationException } from "~common/exceptions";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AuditJournal } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupOperation implements Operations.RoleConflictGroup.Contract {
    private readonly entityType = AccessControlEntityType.CONFLICT_GROUP;
    private readonly dictionaryPath = "operations.role-conflict-group";
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

    public async create({ context, input, realm, actor }: Operations.RoleConflictGroup.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
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

                this.roleConflictGroupService.create({
                    input: { ...input, members: roleEntities },
                    realm: realmEntity,
                    transaction,
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.CREATE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.CREATED` };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async update({ context, input, realm, actor, id }: Operations.RoleConflictGroup.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleConflictGroupRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.roleConflictGroupService.update({
                    input: { ...input, entity },
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.UPDATE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async purge({ context, input, realm, actor }: Operations.RoleConflictGroup.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                this.roleConflictGroupService.purge({
                    input: { ...input, entities },
                    transaction,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.DELETE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async revoke({ context, input, realm, actor }: Operations.RoleConflictGroup.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                this.roleConflictGroupService.revoke({
                    input: { ...input, entities },
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.REVOKE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.REVOKED` };
                }
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async restore({ context, input, realm, actor }: Operations.RoleConflictGroup.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleConflictGroupRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.GROUPS_NOT_FOUND`);
                }

                this.roleConflictGroupService.restore({
                    input: { ...input, entities },
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.RESTORE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.RESTORED` };
                }
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }
}
