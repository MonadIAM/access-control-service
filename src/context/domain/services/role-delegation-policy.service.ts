import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_DELEGATION_POLICY_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { RoleDelegationPolicy } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyService implements Services.RoleDelegationPolicy.Contract {
    private readonly dictionaryPath = "services.role-delegation-policy";

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
    ) {}

    public async create(props: Services.RoleDelegationPolicy.Create.Props): Services.RoleDelegationPolicy.Create.Result {
        const { transaction, realm, input } = props;
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
            const [found] = roleEntities;

            if (found?.id === input.delegator) {
                throw Exception.notFound({ messageKey: `${this.dictionaryPath}.TARGET_ROLE_NOT_FOUND` });
            } else if (found?.id === input.target) {
                throw Exception.notFound({ messageKey: `${this.dictionaryPath}.DELEGATOR_ROLE_NOT_FOUND` });
            } else {
                throw Exception.notFound({ messageKey: `${this.dictionaryPath}.BOTH_ROLES_NOT_FOUND` });
            }
        } else {
            const [delegator, target] = roleEntities[0].id === input.delegator ? roleEntities : roleEntities.reverse();

            const [limitExceeded, existsTransitivePath] = await Promise.all([
                this.roleDelegationPolicyRepository.wouldExceedPolicyLimit({
                    delegator: delegator.id,
                    transaction,
                }),
                this.roleDelegationPolicyRepository.existsTransitivePath({
                    to: delegator.id,
                    from: target.id,
                    transaction,
                }),
            ]);

            if (limitExceeded) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.LIMIT_EXCEEDED` });
            } else if (existsTransitivePath) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.EXISTS_TRANSITIVE_PATH` });
            } else {
                const entity = new RoleDelegationPolicy({
                    justification: input.justification,
                    depthLimit: input.depthLimit,
                    expiresAt: input.expiresAt,
                    realm: realmEntity,
                    delegator,
                    target,
                });

                entity.canCreate();
                transaction.persist(entity);
            }
        }
    }

    public async update(props: Services.RoleDelegationPolicy.Update.Props): Services.RoleDelegationPolicy.Update.Result {
        const { transaction, realm, patch, id } = props;
        const entity = await this.roleDelegationPolicyRepository.findUniqueOrThrow({
            where: { id, realm },
            transaction,
        });

        entity.update({ patch });
    }

    public async revoke(props: Services.RoleDelegationPolicy.Revoke.Props): Services.RoleDelegationPolicy.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.roleDelegationPolicyRepository.find({
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.POLICIES_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            return entities;
        }
    }

    public async restore(props: Services.RoleDelegationPolicy.Restore.Props): Services.RoleDelegationPolicy.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.roleDelegationPolicyRepository.find({
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.POLICIES_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.restore();
            }

            return entities;
        }
    }

    public expire(props: Services.RoleDelegationPolicy.Expire.Props): Services.RoleDelegationPolicy.Expire.Result {
        const { transaction, entities } = props;
        for (const entity of entities) {
            transaction.merge(entity);
            entity.revoke();
        }
    }

    public async purge(props: Services.RoleDelegationPolicy.Purge.Props): Services.RoleDelegationPolicy.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.roleDelegationPolicyRepository.find({
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.POLICIES_NOT_FOUND` });
        } else {
            transaction.clear();

            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }
}
