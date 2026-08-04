import { Inject, Injectable, Scope } from "@nestjs/common";
import {
    NotificationContentKind,
    NotificationTopicAction,
    AccessCacheTopicAction,
    MembershipTopicAction,
    NotificationCategory,
    RealmTopicAction,
    PlatformService,
    MessageTemplate,
} from "@monadiam/shared";

import { ActionType, EntityType, KafkaTopic, InvalidationScope } from "~context/enums";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services";
import { SystemRealm } from "~infrastructure/datasets/realm.dataset";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    PERMISSION_OVERRIDE_REPOSITORY,
    REALM_REPOSITORY,
} from "~context/domain/repositories";

import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE, PERMISSION_OVERRIDE_SERVICE, REALM_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class RealmCommands implements Commands.Realm.Contract {
    private readonly dictionaryPath = "commands.realm";
    private readonly resource = "Realm";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.PublicContract,
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.CommandContract,
        @Inject(PERMISSION_OVERRIDE_SERVICE)
        private readonly permissionOverrideService: Services.PermissionOverride.CommandContract,
        @Inject(REALM_SERVICE)
        private readonly realmService: Services.Realm.CommandContract,
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.Contract,
    ) {}

    public async create(props: Commands.Realm.Create.Props): Commands.Realm.Create.Result {
        const { input, actor } = props;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
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
                destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                actionType: ProjectionScript.REALM_CREATE,
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
            outbox: [
                {
                    payloadMapper: (entities: Entities.Realm[]): Scripts.Realm.Purge => ({
                        realms: entities.map(({ id }) => id),
                    }),
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.REALM_PURGE,
                },
                {
                    payloadMapper: this.accessCachePayloadMapper.bind(this),
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.realmLifecyclePayloadMapper.bind(this),
                    actionType: RealmTopicAction.PURGE,
                    destinationTopic: KafkaTopic.REALM,
                },
            ],
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
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.REALMS_NOT_FOUND` });
                } else {
                    this.realmService.purge({ transaction, entities });
                    return entities;
                }
            },
        });

        if (Array.isArray(entities) && entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.Realm.Revoke.Props): Commands.Realm.Revoke.Result {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: (entities: Entities.Realm[]): Scripts.Realm.Update => ({
                        realms: entities.map(({ id }) => id),
                        isRevoked: true,
                    }),
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.REALM_UPDATE,
                },
                {
                    payloadMapper: this.accessCachePayloadMapper.bind(this),
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.realmLifecyclePayloadMapper.bind(this),
                    actionType: RealmTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.REALM,
                },
            ],
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
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.REALMS_NOT_FOUND` });
                } else {
                    this.realmService.revoke({ entities });
                    return entities;
                }
            },
        });

        if (Array.isArray(entities) && entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Realm.Restore.Props): Commands.Realm.Restore.Result {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: (entities: Entities.Realm[]): Scripts.Realm.Update => ({
                        realms: entities.map(({ id }) => id),
                        isRevoked: false,
                    }),
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.REALM_UPDATE,
                },
                {
                    payloadMapper: this.accessCachePayloadMapper.bind(this),
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.realmLifecyclePayloadMapper.bind(this),
                    actionType: RealmTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.REALM,
                },
            ],
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
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.REALMS_NOT_FOUND` });
                } else {
                    this.realmService.restore({ entities });
                    return entities;
                }
            },
        });

        if (Array.isArray(entities) && entities.length > 1) {
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
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ACCOUNT_NOT_MEMBER` });
        }

        await this.transactionalService.run<Commands.Realm.Exclude.ExecuteResult>({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: ({ assignments }) => ({
                        items: assignments.map(({ realm, account, role }) => ({
                            realm: realm.id,
                            role: role.id,
                            account,
                        })),
                    }),
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: ({ overrides }) => ({
                        items: overrides.map(({ permission, account, realm }) => ({
                            permissionRealm: SystemRealm.id,
                            permission: permission.id,
                            realm: realm.id,
                            account,
                        })),
                    }),
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.accessCachePayloadMapper.bind(this, { account: input.account, realm }),
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.membershipPayloadMapper.bind(this, { account: input.account, realm }),
                    actionType: MembershipTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.MEMBERSHIP,
                },
                {
                    payloadMapper: this.notificationPayloadMapper.bind(this),
                    actionType: NotificationTopicAction.CREATE,
                    destinationTopic: KafkaTopic.NOTIFICATION,
                },
            ],
            audit: {
                actionType: ActionType.EXCLUDE,
                entityType: EntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const [assignments, overrides, realmEntity] = await Promise.all([
                    this.accountRoleAssignmentRepository.find({
                        where: { account: input.account, realm },
                        transaction,
                    }),
                    this.permissionOverrideRepository.find({
                        where: { account: input.account, realm },
                        transaction,
                    }),
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                ]);

                this.accountRoleAssignmentService.purge({ transaction, entities: assignments });
                this.permissionOverrideService.purge({ transaction, entities: overrides });

                return { assignments, overrides, realm: realmEntity, account: input.account };
            },
        });

        return { message: `${this.dictionaryPath}.EXCLUDED` };
    }

    public notificationPayloadMapper(
        props: Commands.Realm.NotificationPayloadMapper.Props,
    ): Commands.Realm.NotificationPayloadMapper.Result {
        return {
            sourceService: PlatformService.ACCESS_CONTROL_SERVICE,
            template: MessageTemplate.REALM_EXCLUDED,
            kind: NotificationContentKind.TEMPLATE,
            category: NotificationCategory.SYSTEM,
            params: { realm: props.realm.name },
            recipient: props.account,
            language: "en",
        };
    }

    public accessCachePayloadMapper(
        props: Commands.Realm.AccessCachePayloadMapper.Props,
    ): Commands.Realm.AccessCachePayloadMapper.Result {
        if (Array.isArray(props)) {
            return {
                items: props.map(({ id }) => ({
                    scope: InvalidationScope.REALM,
                    realm: id,
                })),
            };
        } else {
            return {
                items: [
                    {
                        scope: InvalidationScope.ACCOUNT_REALM,
                        account: props.account,
                        realm: props.realm,
                    },
                ],
            };
        }
    }

    public membershipPayloadMapper(
        props: Commands.Realm.MembershipPayloadMapper.Props,
    ): Commands.Realm.MembershipPayloadMapper.Result {
        return { account: props.account, realm: props.realm };
    }

    public realmLifecyclePayloadMapper(
        props: Commands.Realm.RealmLifecyclePayloadMapper.Props,
    ): Commands.Realm.RealmLifecyclePayloadMapper.Result {
        return props.map(({ id, version }) => ({
            version: version + 1,
            realm: id,
        }));
    }
}
