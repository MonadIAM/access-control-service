import { Inject, Injectable, Scope } from "@nestjs/common";

import { SystemRealm } from "~infrastructure/datasets/system/realm.dataset";
import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { REALM_SERVICE } from "~context/domain/services";
import { EventType, EntityType } from "~context/enums";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RealmCommands implements Commands.Realm.Contract {
    private readonly dictionaryPath = "commands.realm";
    private readonly resource = "Realm";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(REALM_SERVICE)
        private readonly realmService: Services.Realm.Contract,
    ) {}

    public async create(props: Commands.Realm.Create.Props): Promise<Commands.Realm.Create.Result> {
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
                }: Services.Realm.Create.Result): Scripts.Realm.Create => ({
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
                actionType: EventType.CREATE,
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

    public async update(props: Commands.Realm.Update.Props): Promise<Commands.Realm.Update.Result> {
        const { input, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: EventType.UPDATE,
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

    public async purge(props: Commands.Realm.Purge.Props): Promise<Commands.Realm.Purge.Result> {
        const { input } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.REALM_PURGE,
                payloadMapper: (entities: Entities.Realm[]): Scripts.Realm.Purge => ({
                    realms: entities.map(({ id }) => id),
                }),
            },
            audit: {
                actionType: EventType.DELETE,
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

    public async revoke(props: Commands.Realm.Revoke.Props): Promise<Commands.Realm.Revoke.Result> {
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
            audit: {
                actionType: EventType.REVOKE,
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

    public async restore(props: Commands.Realm.Restore.Props): Promise<Commands.Realm.Restore.Result> {
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
            audit: {
                actionType: EventType.RESTORE,
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
}
