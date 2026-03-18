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

    public async create({ context, input, realm, actor }: Handlers.RoleDelegationPolicy.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const [realmEntity, roleEntities] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.find({
                        where: { id: { $in: [input.delegator, input.target] } },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < 2) {
                    if (roleEntities[0].id === input.delegator) {
                        throw HandlerException.notFound(`${this.dictionaryPath}.TARGET_ROLE_NOT_FOUND`);
                    } else if (roleEntities[0].id === input.target) {
                        throw HandlerException.notFound(`${this.dictionaryPath}.DELEGATOR_ROLE_NOT_FOUND`);
                    } else {
                        throw HandlerException.notFound(`${this.dictionaryPath}.BOTH_ROLES_NOT_FOUND`);
                    }
                } else {
                    const [delegatorEntity, targetEntity] =
                        roleEntities[0].id === input.delegator ? roleEntities : roleEntities.reverse();

                    await this.roleDelegationPolicyService.create({
                        input: {
                            description: input.description,
                            depthLimit: input.depthLimit,
                            delegator: delegatorEntity,
                            target: targetEntity,
                        },
                        realm: realmEntity,
                        transaction,
                        context,
                        actor,
                    });

                    await transaction.flush();

                    return { message: `${this.dictionaryPath}.CREATED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async update({
        context,
        input,
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

                this.roleDelegationPolicyService.update({
                    input: { ...input, entity },
                    transaction,
                    context,
                    realm,
                    actor,
                });

                await transaction.flush();

                return { message: `${this.dictionaryPath}.UPDATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async purge({ context, input, realm, actor }: Handlers.RoleDelegationPolicy.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                }

                this.roleDelegationPolicyService.purge({
                    input: { ...input, entities },
                    transaction,
                    context,
                    realm,
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
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async revoke({ context, input, realm, actor }: Handlers.RoleDelegationPolicy.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                }

                this.roleDelegationPolicyService.revoke({
                    input: { ...input, entities },
                    transaction,
                    context,
                    realm,
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
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async restore({ context, input, realm, actor }: Handlers.RoleDelegationPolicy.Restore): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                }

                this.roleDelegationPolicyService.restore({
                    input: { ...input, entities },
                    transaction,
                    context,
                    realm,
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
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }
}
