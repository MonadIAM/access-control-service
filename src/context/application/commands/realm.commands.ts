import { Inject, Injectable, Scope } from "@nestjs/common";
import { AccessCacheTopicAction } from "@liam/contracts";

import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE, PERMISSION_OVERRIDE_SERVICE, REALM_SERVICE } from "~context/domain/services";
import { ActionType, EntityType, KafkaTopic, InvalidationScope } from "~context/enums";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { SystemRealm } from "~infrastructure/datasets/system/realm.dataset";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { CommandException } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    PERMISSION_OVERRIDE_REPOSITORY,
    REALM_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RealmCommands implements Commands.Realm.Contract {
    private readonly dictionaryPath = "commands.realm";
    private readonly resource = "Realm";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.Contract,
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.Contract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.Contract,
        @Inject(REALM_SERVICE)
        private readonly realmService: Services.Realm.Contract,
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.Contract,
    ) {}

    public async create(props: Commands.Realm.Create.Props): Commands.Realm.Create.Result {
        const { input, actor } = props;

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.REALM_CREATE,
                payloadMapper: ({
                    assignments,
                    paths,
                    realm,
                    roles,
                }: Awaited<Services.Realm.Create.Result>): Scripts.Realm.Create => ({
                    rolePermissionAssignments: assignments.permission.map(({ id, role, permission, scope }) => ({
                        permission: permission.id,
                        assignment: id,
                        role: role.id,
                        scope,
                    })),
                    accountRoleAssignments: assignments.role.map(({ id, account, role }) => ({
                        assignment: id,
                        role: role.id,
                        account,
                    })),
                    paths: paths.map(({ ancestor, descendant, depth }) => ({
                        descendant: descendant.id,
                        ancestor: ancestor.id,
                        depth,
                    })),
                    roles: roles.map(({ id }) => id),
                    permissionRealm: SystemRealm.id,
                    realm: realm.id,
                }),
            },
            audit: {
                actionType: ActionType.CREATE,
                entityType: EntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: (transaction) => {
                return this.realmService.create({
                    transaction,
                    input,
                    actor,
                });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.Realm.Update.Props): Commands.Realm.Update.Result {
        const { input, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: ActionType.UPDATE,
                entityType: EntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.realmRepository.findUniqueOrThrow({
                    where: { id },
                    transaction,
                });

                this.realmService.update({ entity, patch: input.patch });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async purge(props: Commands.Realm.Purge.Props): Commands.Realm.Purge.Result {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.REALM_PURGE,
                payloadMapper: (entities: Entities.Realm[]): Scripts.Realm.Purge => ({
                    realms: entities.map(({ id }) => id),
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.Realm[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                actionType: ActionType.DELETE,
                entityType: EntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                } else {
                    this.realmService.purge({ transaction, entities });
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

    public async revoke(props: Commands.Realm.Revoke.Props): Commands.Realm.Revoke.Result {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.REALM_UPDATE,
                payloadMapper: (entities: Entities.Realm[]): Scripts.Realm.Update => ({
                    realms: entities.map(({ id }) => id),
                    isRevoked: true,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.Realm[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                actionType: ActionType.REVOKE,
                entityType: EntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                } else {
                    this.realmService.revoke({ entities });
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

    public async restore(props: Commands.Realm.Restore.Props): Commands.Realm.Restore.Result {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.REALM_UPDATE,
                payloadMapper: (entities: Entities.Realm[]): Scripts.Realm.Update => ({
                    realms: entities.map(({ id }) => id),
                    isRevoked: false,
                }),
            },
            outbox: {
                payloadMapper: (entities: Entities.Realm[]) => this.outboxPayloadMapper(entities),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                actionType: ActionType.RESTORE,
                entityType: EntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                } else {
                    this.realmService.restore({ entities });
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

    public async exclude(props: Commands.Realm.Exclude.Props): Commands.Realm.Exclude.Result {
        const { realm, input } = props;

        const isAlreadyMember = await this.projectionCacheService.checkRealm({
            account: input.account,
            realm,
        });

        if (!isAlreadyMember) {
            throw CommandException.notFound(`${this.dictionaryPath}.ACCOUNT_NOT_MEMBER`);
        }

        await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: [
                {
                    operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                    payloadMapper: ({
                        assignments,
                    }: Commands.Realm.Exclude.ExecuteResult): Scripts.AccountRoleAssignment.Purge => ({
                        items: assignments.map(({ realm, account, role }) => ({
                            realm: realm.id,
                            role: role.id,
                            account,
                        })),
                    }),
                },
                {
                    operationType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                    payloadMapper: ({
                        overrides,
                    }: Commands.Realm.Exclude.ExecuteResult): Scripts.PermissionOverride.Purge => ({
                        items: overrides.map(({ permission, account, realm }) => ({
                            permissionRealm: SystemRealm.id,
                            permission: permission.id,
                            realm: realm.id,
                            account,
                        })),
                    }),
                },
            ],
            outbox: {
                payloadMapper: () => ({
                    items: [{ scope: InvalidationScope.ACCOUNT_REALM, realm, account: input.account }],
                }),
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            },
            audit: {
                actionType: ActionType.EXCLUDE,
                entityType: EntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const [assignments, overrides] = await Promise.all([
                    this.accountRoleAssignmentRepository.find({
                        where: { account: input.account, realm },
                        transaction,
                    }),
                    this.permissionOverrideRepository.find({
                        where: { account: input.account, realm },
                        transaction,
                    }),
                ]);

                this.accountRoleAssignmentService.purge({ transaction, entities: assignments });
                this.permissionOverrideService.purge({ transaction, entities: overrides });

                return { assignments, overrides };
            },
        });

        return { message: `${this.dictionaryPath}.EXCLUDED` };
    }

    public outboxPayloadMapper(
        entities: Commands.Realm.OutboxPayloadMapper.Props,
    ): Commands.Realm.OutboxPayloadMapper.Result {
        return {
            items: entities.map(({ id }) => ({
                scope: InvalidationScope.REALM,
                realm: id,
            })),
        };
    }
}
