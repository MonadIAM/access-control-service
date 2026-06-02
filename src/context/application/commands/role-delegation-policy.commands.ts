import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_DELEGATION_POLICY_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_DELEGATION_POLICY_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { EventType, EntityType } from "~context/enums";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyCommands implements Commands.RoleDelegationPolicy.Contract {
    private readonly dictionaryPath = "commands.role-delegation-policy";
    private readonly resource = "RoleDelegationPolicy";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(ROLE_DELEGATION_POLICY_SERVICE)
        private readonly roleDelegationPolicyService: Services.RoleDelegationPolicy.Contract,
    ) {}

    public async create(props: Commands.RoleDelegationPolicy.Create.Props): Commands.RoleDelegationPolicy.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.DELEGATION_POLICY,
                actionType: EventType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const [roleEntities, realmEntity] = await Promise.all([
                    this.roleRepository.find({
                        where: { id: { $in: [input.delegator, input.target] }, realm },
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
                }
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.RoleDelegationPolicy.Update.Props): Commands.RoleDelegationPolicy.Update.Result {
        const { input, realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.DELEGATION_POLICY,
                actionType: EventType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.roleDelegationPolicyRepository.findUniqueOrThrow({
                    where: { id, realm },
                    transaction,
                });

                this.roleDelegationPolicyService.update({ entity, patch: input.patch });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async purge(props: Commands.RoleDelegationPolicy.Purge.Props): Commands.RoleDelegationPolicy.Purge.Result {
        const { input, realm } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.DELEGATION_POLICY,
                actionType: EventType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                } else {
                    this.roleDelegationPolicyService.purge({ transaction, entities });
                    return { count: entities.length };
                }
            },
        });

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revoke(props: Commands.RoleDelegationPolicy.Revoke.Props): Commands.RoleDelegationPolicy.Revoke.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.DELEGATION_POLICY,
                actionType: EventType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                } else {
                    this.roleDelegationPolicyService.revoke({ entities });
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

    public async restore(props: Commands.RoleDelegationPolicy.Restore.Props): Commands.RoleDelegationPolicy.Restore.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.DELEGATION_POLICY,
                actionType: EventType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleDelegationPolicyRepository.find({
                    where: { id: { $in: input.identifiers }, realm },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.POLICIES_NOT_FOUND`);
                } else {
                    this.roleDelegationPolicyService.restore({ entities });
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
