import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { EventType, EntityType } from "~context/enums";
import { CommandException } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

const SYSTEM_USER_ROLE = "00000002-0000-4000-8000-100000000002";
const SYSTEM_REALM = "00000001-0000-4000-8000-100000000001";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentCommands implements Commands.AccountRoleAssignment.Contract {
    private readonly dictionaryPath = "commands.account-role-assignment";
    private readonly resource = "AccountRoleAssignment";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.Contract,
    ) {}

    public async create(
        props: Commands.AccountRoleAssignment.Create.Props,
    ): Promise<Commands.AccountRoleAssignment.Create.Result> {
        const { input, actor, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Create => ({
                    assignments: entities.map(({ id, role }) => ({
                        assignment: id,
                        role: role.id,
                    })),
                    account: input.account,
                    realm,
                }),
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
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
                        where: { id: { $in: input.roles } },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < input.roles.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                } else {
                    return this.accountRoleAssignmentService.create({
                        input: { account: input.account, roles: roleEntities },
                        realm: realmEntity,
                        transaction,
                        actor,
                    });
                }
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(
        props: Commands.AccountRoleAssignment.Purge.Props,
    ): Promise<Commands.AccountRoleAssignment.Purge.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Purge => ({
                    items: entities.map(({ realm, account, role }) => ({
                        realm: realm.id,
                        role: role.id,
                        account,
                    })),
                }),
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: EventType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                } else {
                    this.accountRoleAssignmentService.purge({ transaction, entities });

                    return entities;
                }
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(
        props: Commands.AccountRoleAssignment.Revoke.Props,
    ): Promise<Commands.AccountRoleAssignment.Revoke.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Update => ({
                    isRevoked: true,
                    items: entities.map(({ id, realm, account, role }) => ({
                        realm: realm.id,
                        assignment: id,
                        role: role.id,
                        account,
                    })),
                }),
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: EventType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                } else {
                    this.accountRoleAssignmentService.revoke({ entities });

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
        props: Commands.AccountRoleAssignment.Restore.Props,
    ): Promise<Commands.AccountRoleAssignment.Restore.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Update => ({
                    isRevoked: false,
                    items: entities.map(({ id, realm, account, role }) => ({
                        realm: realm.id,
                        assignment: id,
                        role: role.id,
                        account,
                    })),
                }),
            },
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: EventType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND`);
                } else {
                    this.accountRoleAssignmentService.restore({ entities });

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

    public async assign(
        props: Commands.AccountRoleAssignment.Assign.Props,
    ): Promise<Commands.AccountRoleAssignment.Assign.Result> {
        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                payloadMapper: (entity: Entities.AccountRoleAssignment): Scripts.AccountRoleAssignment.Create => ({
                    realm: SYSTEM_REALM,
                    account: props.account,
                    assignments: [
                        {
                            assignment: entity.id,
                            role: SYSTEM_USER_ROLE,
                        },
                    ],
                }),
            },
            execute: async (transaction) => {
                const [realmEntity, roleEntity] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: SYSTEM_REALM },
                        transaction,
                    }),
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: SYSTEM_USER_ROLE },
                        transaction,
                    }),
                ]);

                return this.accountRoleAssignmentService.assign({
                    transaction,
                    input: {
                        account: props.account,
                        realm: realmEntity,
                        role: roleEntity,
                    },
                });
            },
        });
    }

    public async clean(
        props: Commands.AccountRoleAssignment.Clean.Props,
    ): Promise<Commands.AccountRoleAssignment.Clean.Result> {
        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                payloadMapper: (entities: Entities.AccountRoleAssignment[]): Scripts.AccountRoleAssignment.Purge => ({
                    items: entities.map(({ realm, account, role }) => ({
                        realm: realm.id,
                        role: role.id,
                        account,
                    })),
                }),
            },
            execute: async (transaction) => {
                const entities = await this.accountRoleAssignmentRepository.find({
                    where: { account: props.account },
                    transaction,
                });

                this.accountRoleAssignmentService.purge({ transaction, entities });
                return entities;
            },
        });
    }
}
