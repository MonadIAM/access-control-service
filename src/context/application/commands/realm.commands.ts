import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { REALM_SERVICE } from "~context/domain/services";
import { CommandException } from "~common/exceptions";

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
    ) {}

    public async create(props: Commands.Realm.Create): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.CREATE,
                entityType: AccessControlEntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input, actor } = props;
                await this.realmService.create({
                    transaction,
                    input,
                    actor,
                });

                return { message: `${this.dictionaryPath}.CREATED` };
            },
        });
    }

    public async update(props: Commands.Realm.Update): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.UPDATE,
                entityType: AccessControlEntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input, id } = props;
                const entity = await this.realmRepository.findUniqueOrThrow({
                    where: { id },
                    transaction,
                });

                this.realmService.update({ entity, patch: input.patch });

                return { message: `${this.dictionaryPath}.UPDATED` };
            },
        });
    }

    public async purge(props: Commands.Realm.Purge): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.DELETE,
                entityType: AccessControlEntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input } = props;
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.purge({ transaction, entities });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            },
        });
    }

    public async revoke(props: Commands.Realm.Revoke): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.REVOKE,
                entityType: AccessControlEntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input } = props;
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.revoke({ entities });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.REVOKED` };
                }
            },
        });
    }

    public async restore(props: Commands.Realm.Restore): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: AccessControlActionType.RESTORE,
                entityType: AccessControlEntityType.REALM,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input } = props;
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.restore({ entities });

                if (entities.length > 1) {
                    return {
                        message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`,
                        params: { count: entities.length },
                    };
                } else {
                    return { message: `${this.dictionaryPath}.RESTORED` };
                }
            },
        });
    }
}
