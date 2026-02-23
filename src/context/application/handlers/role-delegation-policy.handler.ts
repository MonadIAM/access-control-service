import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ROLE_DELEGATION_POLICY_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_DELEGATION_POLICY_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyHandler implements Handlers.RoleDelegationPolicy.Contract {
    private readonly dictionaryPath = "handlers.role-delegation-policy";
    private readonly resource = "RoleDelegationPolicy";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
        @Inject(ROLE_DELEGATION_POLICY_SERVICE)
        private readonly roleDelegationPolicyService: Services.RoleDelegationPolicy.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
    ) {}

    public async create({
        input: { delegator, target, description, depthLimit },
        context,
        actor,
        realm,
    }: Handlers.RoleDelegationPolicy.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const [realmEntity, roleEntities] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.find({
                        where: { id: { $in: [delegator, target] } },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < 2) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.`);
                } else {
                    const [delegatorEntity, targetEntity] =
                        roleEntities[0].id === delegator ? roleEntities : roleEntities.reverse();

                    await this.roleDelegationPolicyService.create({
                        input: {
                            delegator: delegatorEntity,
                            target: targetEntity,
                            description,
                            depthLimit,
                        },
                        realm: realmEntity,
                        transaction,
                        context,
                        actor,
                    });

                    return { message: `${this.dictionaryPath}.CREATED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async update({
        input,
        context,
        realm,
        actor,
        id,
    }: Handlers.RoleDelegationPolicy.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entity = await this.roleDelegationPolicyRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                await this.roleDelegationPolicyService.update({
                    transaction,
                    context,
                    entity,
                    realm,
                    input,
                    actor,
                });

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async purge({
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.RoleDelegationPolicy.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.`);
                }

                await this.roleDelegationPolicyService.purge({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async revoke({
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.RoleDelegationPolicy.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.`);
                }

                await this.roleDelegationPolicyService.revoke({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.REVOKED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async restore({
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.RoleDelegationPolicy.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.`);
                }

                await this.roleDelegationPolicyService.restore({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.RESTORED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }
}
