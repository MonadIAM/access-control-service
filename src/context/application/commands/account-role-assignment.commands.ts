import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { PERMISSION_CACHE_SERVICE } from "~context/infrastructure/services";
import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentCommands implements Commands.AccountRoleAssignment.Contract {
    private readonly dictionaryPath = "commands.account-role-assignment";
    private readonly resource = "AccountRoleAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.Contract,
        @Inject(PERMISSION_CACHE_SERVICE)
        private readonly permissionCacheService: Services.PermissionCache.Contract,
    ) {}

    public async create(props: Commands.AccountRoleAssignment.Create): Promise<MessageResult> {
        try {
            const { input, actor, realm } = props;
            await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.ROLE_ASSIGNMENT,
                    actionType: AccessControlActionType.CREATE,
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
                            where: { id: { $in: input.roles } },
                            transaction,
                        }),
                    ]);

                    if (roleEntities.length < input.roles.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
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
                },
            });

            await this.permissionCacheService.invalidate({ accounts: [input.account] });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async purge(props: Commands.AccountRoleAssignment.Purge): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.ROLE_ASSIGNMENT,
                    actionType: AccessControlActionType.DELETE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.accountRoleAssignmentRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                    }

                    this.accountRoleAssignmentService.purge({ transaction, entities });

                    if (entities.length > 1) {
                        return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                    } else {
                        return { message: `${this.dictionaryPath}.PURGED` };
                    }
                },
            });
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async revoke(props: Commands.AccountRoleAssignment.Revoke): Promise<MessageResult> {
        try {
            const entities = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.ROLE_ASSIGNMENT,
                    actionType: AccessControlActionType.REVOKE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.accountRoleAssignmentRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                    }

                    this.accountRoleAssignmentService.revoke({ entities });

                    return entities;
                },
            });

            await this.permissionCacheService.invalidate({ accounts: entities.map(({ account }) => account) });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.REVOKED` };
            }
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async restore(props: Commands.AccountRoleAssignment.Restore): Promise<MessageResult> {
        try {
            const entities = await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.ROLE_ASSIGNMENT,
                    actionType: AccessControlActionType.RESTORE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.accountRoleAssignmentRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                    }

                    this.accountRoleAssignmentService.restore({ entities });

                    return entities;
                },
            });

            await this.permissionCacheService.invalidate({ accounts: entities.map(({ account }) => account) });

            if (entities.length > 1) {
                return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
            } else {
                return { message: `${this.dictionaryPath}.RESTORED` };
            }
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }
}
