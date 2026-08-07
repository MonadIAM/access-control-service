import { Inject, Injectable, Scope } from "@nestjs/common";

import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    PERMISSION_OVERRIDE_REPOSITORY,
    REALM_REPOSITORY,
} from "~context/domain/repositories";
import {
    NotificationTopicAction,
    AccessCacheTopicAction,
    MembershipTopicAction,
    RealmTopicAction,
    ActionType,
    EntityType,
    KafkaTopic,
} from "~context/enums";

import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE, PERMISSION_OVERRIDE_SERVICE, REALM_SERVICE } from "../services";
import { RealmMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RealmCommands implements Commands.Realm.Contract {
    private readonly mapper: Commands.Mappers.Realm.Contract;
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
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.PublicContract,
    ) {
        this.mapper = new RealmMapper();
    }

    public async create(props: Commands.Realm.Create.Props): Commands.Realm.Create.Result {
        const { input, actor } = props;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.projectionCreatePayload,
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

        const { realms } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionPurgePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.REALM_PURGE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.mapper.realmLifecyclePayload,
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
                    return { realms: entities };
                }
            },
        });

        if (realms.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: realms.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.Realm.Revoke.Props): Commands.Realm.Revoke.Result {
        const { input } = props;

        const { realms } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.REALM_UPDATE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.mapper.realmLifecyclePayload,
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
                    return { realms: entities };
                }
            },
        });

        if (realms.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: realms.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Realm.Restore.Props): Commands.Realm.Restore.Result {
        const { input } = props;

        const { realms } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.REALM_UPDATE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.mapper.realmLifecyclePayload,
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
                    return { realms: entities };
                }
            },
        });

        if (realms.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: realms.length } };
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
                    payloadMapper: this.mapper.excludeAssignmentPurgePayload,
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.excludeOverridePurgePayload,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.excludeAccessCachePayload,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
                {
                    payloadMapper: this.mapper.excludeMembershipPayload,
                    actionType: MembershipTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.MEMBERSHIP,
                },
                {
                    payloadMapper: this.mapper.notificationPayload,
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
}
