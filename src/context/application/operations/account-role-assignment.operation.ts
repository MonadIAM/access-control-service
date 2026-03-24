import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { PERMISSION_CACHE_SERVICE } from "~context/infrastructure/services";
import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { OperationException } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";
import { AuditJournal } from "~context/domain/entities";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentOperation implements Operations.AccountRoleAssignment.Contract {
    private readonly entityType = AccessControlEntityType.ROLE_ASSIGNMENT;
    private readonly dictionaryPath = "operations.account-role-assignment";
    private readonly resource = "AccountRoleAssignment";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.Contract,
        @Inject(PERMISSION_CACHE_SERVICE)
        private readonly permissionCacheService: Services.PermissionCache.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
    ) {}

    public async create({ context, input, realm, actor }: Operations.AccountRoleAssignment.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const [realmEntity, roleEntities] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.find({
                        where: { id: { $in: input.roles } },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < input.roles.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                }

                await this.accountRoleAssignmentService.create({
                    input: {
                        account: input.account,
                        roles: roleEntities,
                    },
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
            });

            await this.permissionCacheService.invalidate({ accounts: [input.account] });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async purge({ context, input, realm, actor }: Operations.AccountRoleAssignment.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                }

                this.accountRoleAssignmentService.purge({
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

    public async revoke({ context, input, realm, actor }: Operations.AccountRoleAssignment.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const entities = await writeManager.transactional(async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                }

                this.accountRoleAssignmentService.revoke({
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

                return entities;
            });

            await this.permissionCacheService.invalidate({ accounts: entities.map(({ account }) => account) });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.REVOKED` };
            }
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async restore({
        context,
        input,
        realm,
        actor,
    }: Operations.AccountRoleAssignment.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            const entities = await writeManager.transactional(async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                }

                this.accountRoleAssignmentService.restore({
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

                return entities;
            });

            await this.permissionCacheService.invalidate({ accounts: entities.map(({ account }) => account) });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.RESTORED` };
            }
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }
}
