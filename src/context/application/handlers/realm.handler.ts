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
                await this.realmService.create({
                    input: { ...input, actor },
                    transaction,
                    context,
                });

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

                await this.realmService.update({
                    transaction,
                    context,
                    entity,
                    input,
                    actor,
                });

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async purge({ input: { identifiers, reason }, context, actor }: Handlers.Realm.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.`);
                }

                await this.realmService.purge({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                });

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

    public async revoke({ input: { identifiers, reason }, context, actor }: Handlers.Realm.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.`);
                }

                await this.realmService.revoke({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                });

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

    public async restore({
        input: { identifiers, reason },
        context,
        actor,
    }: Handlers.Realm.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.realmRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.`);
                }

                await this.realmService.restore({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                });

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
