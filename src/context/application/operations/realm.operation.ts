import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { REALM_SERVICE } from "~context/domain/services";
import { OperationException } from "~common/exceptions";
import { AuditJournal } from "~context/domain/entities";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RealmOperation implements Operations.Realm.Contract {
    private readonly entityType = AccessControlEntityType.REALM;
    private readonly dictionaryPath = "operations.realm";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(REALM_SERVICE)
        private readonly realmService: Services.Realm.Contract,
    ) {}

    public async create({ context, input, actor }: Operations.Realm.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                this.realmService.create({
                    transaction,
                    input,
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.CREATE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.CREATED` };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async update({ context, input, actor, id }: Operations.Realm.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.realmRepository.findUniqueOrThrow({
                    where: { id },
                    transaction,
                });

                this.realmService.update({
                    input: { ...input, entity },
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.UPDATE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async purge({ context, input, actor }: Operations.Realm.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.purge({
                    input: { ...input, entities },
                    transaction,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.DELETE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        input,
                    }),
                );

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async revoke({ context, input, actor }: Operations.Realm.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.revoke({
                    input: { ...input, entities },
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.REVOKE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        input,
                    }),
                );

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.REVOKED` };
                }
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }

    public async restore({ context, input, actor }: Operations.Realm.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.restore({
                    input: { ...input, entities },
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.RESTORE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        input,
                    }),
                );

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.RESTORED` };
                }
            });
        } catch (error) {
            throw OperationException.fromOrmError(error);
        }
    }
}
