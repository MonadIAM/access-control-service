import { Inject, Injectable, Scope } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

import {
    AccountRoleAssignmentCreatedEvent,
    AccountRoleAssignmentPurgedEvent,
    AccountRoleAssignmentRevokedEvent,
    AccountRoleAssignmentRestoredEvent,
} from "../events/account-role-assignment.events";

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
        private readonly eventEmitter: EventEmitter2,
    ) {}

    public async create(props: Commands.AccountRoleAssignment.Create): Promise<MessageResult> {
        const { input, actor, realm } = props;

        await this.transactional.run({
            resource: this.resource,
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
                } else {
                    await this.accountRoleAssignmentService.create({
                        input: { account: input.account, roles: roleEntities },
                        realm: realmEntity,
                        transaction,
                        actor,
                    });
                }
            },
        });

        this.eventEmitter.emit(
            AccountRoleAssignmentCreatedEvent.TOKEN,
            new AccountRoleAssignmentCreatedEvent(input.account, realm, input.roles, [input.account]),
        );

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(props: Commands.AccountRoleAssignment.Purge): Promise<MessageResult> {
        const { input } = props;

        const count = await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.ROLE_ASSIGNMENT,
                actionType: AccessControlActionType.DELETE,
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

                    return entities.length;
                }
            },
        });

        this.eventEmitter.emit(
            AccountRoleAssignmentPurgedEvent.TOKEN,
            new AccountRoleAssignmentPurgedEvent(input.identifiers),
        );

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.AccountRoleAssignment.Revoke): Promise<MessageResult> {
        const { input } = props;

        const entities = await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.ROLE_ASSIGNMENT,
                actionType: AccessControlActionType.REVOKE,
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

        this.eventEmitter.emit(
            AccountRoleAssignmentRevokedEvent.TOKEN,
            new AccountRoleAssignmentRevokedEvent(
                entities.map(({ id }) => id),
                entities.map(({ account }) => account),
            ),
        );

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.AccountRoleAssignment.Restore): Promise<MessageResult> {
        const { input } = props;

        const entities = await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.ROLE_ASSIGNMENT,
                actionType: AccessControlActionType.RESTORE,
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

        this.eventEmitter.emit(
            AccountRoleAssignmentRestoredEvent.TOKEN,
            new AccountRoleAssignmentRestoredEvent(
                entities.map(({ id }) => id),
                entities.map(({ account }) => account),
            ),
        );

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }
}
