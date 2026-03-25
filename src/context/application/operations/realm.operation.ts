import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { REALM_SERVICE } from "~context/domain/services";
import { OperationException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RealmOperation implements Operations.Realm.Contract {
    private readonly dictionaryPath = "operations.realm";
    private readonly resource = "Realm";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(REALM_SERVICE)
        private readonly realmService: Services.Realm.Contract,
    ) {}

    public async create(props: Operations.Realm.Create): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async update(props: Operations.Realm.Update): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async purge(props: Operations.Realm.Purge): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
                        throw OperationException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                    }

                    this.realmService.purge({ transaction, entities });

                    if (entities.length > 1) {
                        return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                    } else {
                        return { message: `${this.dictionaryPath}.PURGED` };
                    }
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async revoke(props: Operations.Realm.Revoke): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
                        throw OperationException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                    }

                    this.realmService.revoke({ entities });

                    if (entities.length > 1) {
                        return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                    } else {
                        return { message: `${this.dictionaryPath}.REVOKED` };
                    }
                },
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async restore(props: Operations.Realm.Restore): Promise<MessageResult> {
        try {
            return await this.transactional.run({
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
                        throw OperationException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
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
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }
}
