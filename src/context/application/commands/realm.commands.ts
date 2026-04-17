import { Inject, Injectable, Scope } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { REALM_SERVICE } from "~context/domain/services";
import { CommandException } from "~common/exceptions";

import {
    RealmRestoredEvent,
    RealmCreatedEvent,
    RealmUpdatedEvent,
    RealmRevokedEvent,
    RealmPurgedEvent,
} from "../events/realm.events";

@Injectable({ scope: Scope.DEFAULT })
export class RealmCommands implements Commands.Realm.Contract {
    private readonly dictionaryPath = "commands.realm";
    private readonly resource = "Realm";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(REALM_SERVICE)
        private readonly realmService: Services.Realm.Contract,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    public async create(props: Commands.Realm.Create.Props): Promise<Commands.Realm.Create.Result> {
        const { input, actor } = props;

        const entity = await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.CREATE,
                entityType: AccessControlEntityType.REALM,
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

        this.eventEmitter.emit(RealmCreatedEvent.TOKEN, new RealmCreatedEvent(entity.id, actor));

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.Realm.Update.Props): Promise<Commands.Realm.Update.Result> {
        const { input, id } = props;

        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.UPDATE,
                entityType: AccessControlEntityType.REALM,
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

        this.eventEmitter.emit(RealmUpdatedEvent.TOKEN, new RealmUpdatedEvent(id));

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async purge(props: Commands.Realm.Purge.Props): Promise<Commands.Realm.Purge.Result> {
        const { input } = props;

        const count = await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.DELETE,
                entityType: AccessControlEntityType.REALM,
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

                    return entities.length;
                }
            },
        });

        this.eventEmitter.emit(RealmPurgedEvent.TOKEN, new RealmPurgedEvent(input.identifiers));

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.Realm.Revoke.Props): Promise<Commands.Realm.Revoke.Result> {
        const { input } = props;

        const count = await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.REVOKE,
                entityType: AccessControlEntityType.REALM,
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

                    return entities.length;
                }
            },
        });

        this.eventEmitter.emit(RealmRevokedEvent.TOKEN, new RealmRevokedEvent(input.identifiers));

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Realm.Restore.Props): Promise<Commands.Realm.Restore.Result> {
        const { input } = props;

        const count = await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.RESTORE,
                entityType: AccessControlEntityType.REALM,
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

                    return entities.length;
                }
            },
        });

        this.eventEmitter.emit(RealmRestoredEvent.TOKEN, new RealmRestoredEvent(input.identifiers));

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }
}
