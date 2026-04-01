import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_DELEGATION_POLICY_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { ROLE_DELEGATION_POLICY_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyCommand implements Commands.RoleDelegationPolicy.Contract {
    private readonly dictionaryPath = "commands.role-delegation-policy";
    private readonly resource = "RoleDelegationPolicy";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ROLE_DELEGATION_POLICY_SERVICE)
        private readonly roleDelegationPolicyService: Services.RoleDelegationPolicy.Contract,
    ) {}

    public async create(props: Commands.RoleDelegationPolicy.Create): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.DELEGATION_POLICY,
                    actionType: AccessControlActionType.CREATE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm } = props;
                    const [roleEntities, realmEntity] = await Promise.all([
                        this.roleRepository.find({
                            where: { id: { $in: [input.delegator, input.target] } },
                            transaction,
                        }),
                        this.realmRepository.findUniqueOrThrow({
                            where: { id: realm },
                            transaction,
                        }),
                    ]);

                    if (roleEntities.length < 2) {
                        if (roleEntities[0].id === input.delegator) {
                            throw CommandException.notFound(`${this.dictionaryPath}.TARGET_ROLE_NOT_FOUND`);
                        } else if (roleEntities[0].id === input.target) {
                            throw CommandException.notFound(`${this.dictionaryPath}.DELEGATOR_ROLE_NOT_FOUND`);
                        } else {
                            throw CommandException.notFound(`${this.dictionaryPath}.BOTH_ROLES_NOT_FOUND`);
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
                        });

                        return { message: `${this.dictionaryPath}.CREATED` };
                    }
                },
            });
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async update(props: Commands.RoleDelegationPolicy.Update): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.DELEGATION_POLICY,
                    actionType: AccessControlActionType.UPDATE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input, realm, id } = props;
                    const entity = await this.roleDelegationPolicyRepository.findUniqueOrThrow({
                        where: { id, realm },
                        transaction,
                    });

                    this.roleDelegationPolicyService.update({ entity, patch: input.patch });

                    return { message: `${this.dictionaryPath}.UPDATED` };
                },
            });
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async purge(props: Commands.RoleDelegationPolicy.Purge): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.DELEGATION_POLICY,
                    actionType: AccessControlActionType.DELETE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.roleDelegationPolicyRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                    }

                    this.roleDelegationPolicyService.purge({ transaction, entities });

                    if (entities.length > 1) {
                        return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                    } else {
                        return { message: `${this.dictionaryPath}.PURGED` };
                    }
                },
            });
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async revoke(props: Commands.RoleDelegationPolicy.Revoke): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.DELEGATION_POLICY,
                    actionType: AccessControlActionType.REVOKE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.roleDelegationPolicyRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                    }

                    this.roleDelegationPolicyService.revoke({ entities });

                    if (entities.length > 1) {
                        return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
                    } else {
                        return { message: `${this.dictionaryPath}.REVOKED` };
                    }
                },
            });
        } catch (error) {
            throw CommandException.fromOrmError(error, this.resource);
        }
    }

    public async restore(props: Commands.RoleDelegationPolicy.Restore): Promise<MessageResult> {
        try {
            return await this.transactional.run({
                audit: {
                    entityType: AccessControlEntityType.DELEGATION_POLICY,
                    actionType: AccessControlActionType.REVOKE,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const { input } = props;
                    const entities = await this.roleDelegationPolicyRepository.find({
                        where: { id: { $in: input.identifiers } },
                        transaction,
                    });

                    if (entities.length < input.identifiers.length) {
                        throw CommandException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                    }

                    this.roleDelegationPolicyService.restore({ entities });

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
            throw CommandException.fromOrmError(error, this.resource);
        }
    }
}
