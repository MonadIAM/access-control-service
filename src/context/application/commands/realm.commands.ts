import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessCacheTopicAction, RealmTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { SYSTEM_REALM_ID, CONSUMER_META } from "~context/constants";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { REALM_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";

import { RealmMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RealmCommands implements Commands.Realm.Contract {
    private readonly mapper: Commands.Mappers.Realm.Contract;
    private readonly dictionaryPath = "commands.realm";
    private readonly resource = "Realm";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(REALM_SERVICE)
        private readonly realmService: Services.Realm.CommandContract,
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
                await this.realmService.update({ patch: input.patch, transaction, id });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.Realm.Revoke.Props): Commands.Realm.Revoke.Result {
        const { input, actor, global } = props;

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
                realm: SYSTEM_REALM_ID,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const realms = await this.realmService.revoke({
                    identifiers: input.identifiers,
                    transaction,
                    global,
                    actor,
                });

                return { realms, actor };
            },
        });

        if (realms.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: realms.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Realm.Restore.Props): Commands.Realm.Restore.Result {
        const { input, actor, global } = props;

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
                realm: SYSTEM_REALM_ID,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const realms = await this.realmService.restore({
                    identifiers: input.identifiers,
                    transaction,
                    global,
                    actor,
                });

                return { realms, actor };
            },
        });

        if (realms.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: realms.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.Realm.Purge.Props): Commands.Realm.Purge.Result {
        const { input, actor, global } = props;

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
                realm: SYSTEM_REALM_ID,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const realms = await this.realmService.purge({
                    identifiers: input.identifiers,
                    transaction,
                    global,
                    actor,
                });

                return { realms, actor };
            },
        });

        if (realms.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: realms.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async bootstrapOrganization(
        props: Commands.Realm.BootstrapOrganization.Props,
    ): Commands.Realm.BootstrapOrganization.Result {
        const { incoming, ...request } = props;

        try {
            await this.transactionalService.consume({
                incoming,
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.projectionCreatePayload,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                        actionType: ProjectionScript.REALM_CREATE,
                    },
                    {
                        payloadMapper: this.mapper.bootstrapConfirmed,
                        actionType: RealmTopicAction.BOOTSTRAP_CONFIRMED,
                        destinationTopic: KafkaTopic.REALM,
                    },
                ],
                audit: {
                    actionType: ActionType.CREATE,
                    entityType: EntityType.REALM,
                    context: CONSUMER_META,
                    ...request,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const result = await this.realmService.bootstrapOrganization({ ...request, transaction });
                    return { ...result, request };
                },
            });
        } catch (error) {
            if (!(error instanceof Exception) || Boolean(Exception.isRetryable(error))) {
                throw error;
            } else {
                await this.rejectBootstrap({
                    reason: error instanceof Error ? error.message : String(error),
                    incoming,
                    request,
                });
            }
        }
    }

    public async bootstrapProject(props: Commands.Realm.BootstrapProject.Props): Commands.Realm.BootstrapProject.Result {
        const { incoming, ...request } = props;

        try {
            await this.transactionalService.consume({
                incoming,
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.projectionCreatePayload,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                        actionType: ProjectionScript.REALM_CREATE,
                    },
                    {
                        payloadMapper: this.mapper.bootstrapConfirmed,
                        destinationTopic: KafkaTopic.REALM,
                        actionType: RealmTopicAction.BOOTSTRAP_CONFIRMED,
                    },
                ],
                audit: {
                    actionType: ActionType.CREATE,
                    entityType: EntityType.REALM,
                    context: CONSUMER_META,
                    ...request,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const result = await this.realmService.bootstrapProject({ ...request, transaction });
                    return { ...result, request };
                },
            });
        } catch (error) {
            if (!(error instanceof Exception) || Boolean(Exception.isRetryable(error))) {
                throw error;
            } else {
                await this.rejectBootstrap({
                    reason: error instanceof Error ? error.message : String(error),
                    incoming,
                    request,
                });
            }
        }
    }

    public async transferOwnership(props: Commands.Realm.TransferOwnership.Props): Commands.Realm.TransferOwnership.Result {
        const { incoming, ...request } = props;

        try {
            await this.transactionalService.consume({
                incoming,
                resource: this.resource,
                outbox: [
                    {
                        payloadMapper: this.mapper.transferAssignmentPurge,
                        actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.transferAssignmentCreate,
                        actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                        destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    },
                    {
                        payloadMapper: this.mapper.transferAccessCache,
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    },
                    {
                        payloadMapper: this.mapper.transferConfirmed,
                        actionType: RealmTopicAction.TRANSFER_OWNERSHIP_CONFIRMED,
                        destinationTopic: KafkaTopic.REALM,
                    },
                ],
                audit: {
                    entityType: EntityType.REALM,
                    actionType: ActionType.UPDATE,
                    context: CONSUMER_META,
                    ...request,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const result = await this.realmService.transferOwnership({ ...request, transaction });
                    return { ...result, request };
                },
            });
        } catch (error) {
            if (!(error instanceof Exception) || Boolean(Exception.isRetryable(error))) {
                throw error;
            } else {
                await this.rejectTransfer({
                    reason: error instanceof Error ? error.message : String(error),
                    incoming,
                    request,
                });
            }
        }
    }

    public async rejectBootstrap(props: Commands.Realm.RejectBootstrap.Props): Commands.Realm.RejectBootstrap.Result {
        const { incoming, ...result } = props;

        await this.transactionalService.consume({
            incoming,
            resource: this.resource,
            payload: this.mapper.bootstrapRejected(result),
            actionType: RealmTopicAction.BOOTSTRAP_REJECTED,
            destinationTopic: KafkaTopic.REALM,
            audit: {
                entityType: EntityType.REALM,
                actionType: ActionType.CREATE,
                actor: result.request.actor,
                realm: result.request.realm,
                context: CONSUMER_META,
                input: result,
            },
        });
    }

    public async rejectTransfer(props: Commands.Realm.RejectTransfer.Props): Commands.Realm.RejectTransfer.Result {
        const { incoming, ...result } = props;

        await this.transactionalService.consume({
            incoming,
            resource: this.resource,
            payload: this.mapper.transferRejected(result),
            actionType: RealmTopicAction.TRANSFER_OWNERSHIP_REJECTED,
            destinationTopic: KafkaTopic.REALM,
            audit: {
                entityType: EntityType.REALM,
                actionType: ActionType.UPDATE,
                actor: result.request.actor,
                realm: result.request.realm,
                context: CONSUMER_META,
                input: result,
            },
        });
    }

    public async revokeBySystem(props: Commands.Realm.RevokeBySystem.Props): Commands.Realm.RevokeBySystem.Result {
        const { incoming, actor, realm } = props;

        await this.transactionalService.consume({
            incoming,
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.projectionUpdatePayload,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                    actionType: ProjectionScript.REALM_UPDATE,
                },
                {
                    payloadMapper: this.mapper.accessCachePayload,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                },
                {
                    payloadMapper: this.mapper.realmLifecyclePayload,
                    destinationTopic: KafkaTopic.REALM,
                    actionType: RealmTopicAction.REVOKE,
                },
            ],
            audit: {
                entityType: EntityType.REALM,
                actionType: ActionType.REVOKE,
                context: CONSUMER_META,
                input: { realm },
                actor,
                realm,
            },
            changeLog: true,
            execute: async (transaction) => {
                const realms = await this.realmService.revokeBySystem({ transaction, realm });
                return { realms, actor };
            },
        });
    }

    public async restoreBySystem(props: Commands.Realm.RestoreBySystem.Props): Commands.Realm.RestoreBySystem.Result {
        const { incoming, actor, realm } = props;

        await this.transactionalService.consume({
            incoming,
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
                entityType: EntityType.REALM,
                actionType: ActionType.RESTORE,
                context: CONSUMER_META,
                input: { realm },
                actor,
                realm,
            },
            changeLog: true,
            execute: async (transaction) => {
                const realms = await this.realmService.restoreBySystem({ transaction, realm });
                return { realms, actor };
            },
        });
    }

    public async purgeBySystem(props: Commands.Realm.PurgeBySystem.Props): Commands.Realm.PurgeBySystem.Result {
        const { incoming, actor, realm } = props;

        await this.transactionalService.consume({
            incoming,
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
                    destinationTopic: KafkaTopic.REALM,
                    actionType: RealmTopicAction.PURGE,
                },
            ],
            audit: {
                entityType: EntityType.REALM,
                actionType: ActionType.DELETE,
                context: CONSUMER_META,
                input: { realm },
                actor,
                realm,
            },
            changeLog: true,
            execute: async (transaction) => {
                const realms = await this.realmService.purgeBySystem({ transaction, realm });
                return { realms, actor };
            },
        });
    }

    public async purgeAccountAccess(
        props: Commands.Realm.PurgeAccountAccess.Props,
    ): Commands.Realm.PurgeAccountAccess.Result {
        const { incoming, actor, realm, input } = props;

        await this.transactionalService.consume({
            incoming,
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.accessAssignmentPurge,
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessOverridePurge,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_PURGE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCache,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.DELETE,
                context: CONSUMER_META,
                input,
                actor,
                realm,
            },
            changeLog: true,
            execute: (transaction) => {
                return this.realmService.purgeAccountAccess({ transaction, realm, ...input });
            },
        });
    }

    public async revokeAccountAccess(
        props: Commands.Realm.RevokeAccountAccess.Props,
    ): Commands.Realm.RevokeAccountAccess.Result {
        const { incoming, actor, realm, input } = props;

        await this.transactionalService.consume({
            incoming,
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.accessAssignmentUpdate,
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessOverrideUpdate,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCache,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.REVOKE,
                context: CONSUMER_META,
                input,
                actor,
                realm,
            },
            changeLog: true,
            execute: (transaction) => {
                return this.realmService.revokeAccountAccess({ transaction, realm, ...input });
            },
        });
    }

    public async restoreAccountAccess(
        props: Commands.Realm.RestoreAccountAccess.Props,
    ): Commands.Realm.RestoreAccountAccess.Result {
        const { incoming, actor, realm, input } = props;

        await this.transactionalService.consume({
            incoming,
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.accessAssignmentUpdate,
                    actionType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessOverrideUpdate,
                    actionType: ProjectionScript.PERMISSION_OVERRIDE_UPDATE,
                    destinationTopic: KafkaTopic.PROJECTION_JOURNAL,
                },
                {
                    payloadMapper: this.mapper.accessCache,
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                },
            ],
            audit: {
                entityType: EntityType.ROLE_ASSIGNMENT,
                actionType: ActionType.RESTORE,
                context: CONSUMER_META,
                input,
                actor,
                realm,
            },
            changeLog: true,
            execute: (transaction) => {
                return this.realmService.restoreAccountAccess({ transaction, realm, ...input });
            },
        });
    }
}
