import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_DELEGATION_POLICY_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_DELEGATION_POLICY_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ActionType, EntityType } from "~context/enums";
import { SYSTEM_ACCOUNT_ID } from "~context/constants";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyCommands implements Commands.RoleDelegationPolicy.Contract {
    private readonly dictionaryPath = "commands.role-delegation-policy";
    private readonly resource = "RoleDelegationPolicy";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.PublicContract,
        @Inject(ROLE_DELEGATION_POLICY_SERVICE)
        private readonly roleDelegationPolicyService: Services.RoleDelegationPolicy.CommandContract,
    ) {}

    public async create(props: Commands.RoleDelegationPolicy.Create.Props): Commands.RoleDelegationPolicy.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.DELEGATION_POLICY,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.roleDelegationPolicyService.create({ transaction, realm, input });
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
                actionType: ActionType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.roleDelegationPolicyService.update({ patch: input.patch, transaction, realm, id });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.RoleDelegationPolicy.Revoke.Props): Commands.RoleDelegationPolicy.Revoke.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.DELEGATION_POLICY,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.roleDelegationPolicyService.revoke({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });
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
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.roleDelegationPolicyService.restore({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async expire(props: Commands.RoleDelegationPolicy.Expire.Props): Commands.RoleDelegationPolicy.Expire.Result {
        const now = props.now ?? new Date();
        const policies = await this.roleDelegationPolicyRepository.find({
            where: { isRevoked: false, expiresAt: { $lte: now } },
            options: { limit: props.batchSize },
        });

        if (policies.length) {
            let expired = 0;
            await this.transactionalService.run({
                resource: this.resource,
                audit: {
                    actor: SYSTEM_ACCOUNT_ID,
                    entityType: EntityType.DELEGATION_POLICY,
                    actionType: ActionType.REVOKE,
                    input: {
                        identifiers: policies.map(({ id }) => id),
                        expiresAt: now.toISOString(),
                        reason: "expired",
                    },
                    context: {
                        userAgent: "scheduler",
                        ip: "127.0.0.1",
                    },
                },
                changeLog: true,
                execute: (transaction) => {
                    this.roleDelegationPolicyService.expire({ transaction, entities: policies });
                    expired = policies.length;
                    return policies;
                },
            });

            return expired;
        } else {
            return 0;
        }
    }

    public async purge(props: Commands.RoleDelegationPolicy.Purge.Props): Commands.RoleDelegationPolicy.Purge.Result {
        const { input, realm } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.DELEGATION_POLICY,
                actionType: ActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleDelegationPolicyService.purge({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { count: entities.length };
            },
        });

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }
}
