import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { REALM_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RealmHandler implements Handlers.Realm.Contract {
    private readonly dictionaryPath = "handlers.realm";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(REALM_SERVICE)
        private readonly realmService: Services.Realm.Contract,
    ) {}

    public async create({ context, input, actor }: Handlers.Realm.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                this.realmService.create({
                    transaction,
                    context,
                    input,
                    actor,
                });

                await transaction.flush();

                return { message: `${this.dictionaryPath}.CREATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async update({ context, input, actor, id }: Handlers.Realm.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.realmRepository.findUniqueOrThrow({
                    where: { id },
                    transaction,
                });

                this.realmService.update({
                    input: { ...input, entity },
                    transaction,
                    context,
                    actor,
                });

                await transaction.flush();

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async purge({ context, input, actor }: Handlers.Realm.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.purge({
                    input: { ...input, entities },
                    transaction,
                    context,
                    actor,
                });

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async revoke({ context, input, actor }: Handlers.Realm.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.revoke({
                    input: { ...input, entities },
                    transaction,
                    context,
                    actor,
                });

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.REVOKED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async restore({ context, input, actor }: Handlers.Realm.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.REALMS_NOT_FOUND`);
                }

                this.realmService.restore({
                    input: { ...input, entities },
                    transaction,
                    context,
                    actor,
                });

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.RESTORED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
