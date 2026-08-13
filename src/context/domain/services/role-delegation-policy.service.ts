import { Inject, Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";

import { ROLE_DELEGATION_POLICY_REPOSITORY } from "../repositories";
import { RoleDelegationPolicy } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyService implements Services.RoleDelegationPolicy.Contract {
    private readonly dictionaryPath = "services.role-delegation-policy";

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.PublicContract,
    ) {}

    public async create(props: Services.RoleDelegationPolicy.Create.Props): Services.RoleDelegationPolicy.Create.Result {
        const { transaction, realm, input } = props;
        const [limitExceeded, existsTransitivePath] = await Promise.all([
            this.roleDelegationPolicyRepository.wouldExceedPolicyLimit({
                delegator: input.delegator.id,
                transaction,
            }),
            this.roleDelegationPolicyRepository.existsTransitivePath({
                to: input.delegator.id,
                from: input.target.id,
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
                delegator: input.delegator,
                target: input.target,
                realm,
            });

            entity.canCreate();
            transaction.persist(entity);
        }
    }

    public update(props: Services.RoleDelegationPolicy.Update.Props): Services.RoleDelegationPolicy.Update.Result {
        const { entity, patch } = props;
        entity.update({ patch });
    }

    public purge(props: Services.RoleDelegationPolicy.Purge.Props): Services.RoleDelegationPolicy.Purge.Result {
        const { transaction, entities } = props;
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke(props: Services.RoleDelegationPolicy.Revoke.Props): Services.RoleDelegationPolicy.Revoke.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.RoleDelegationPolicy.Restore.Props): Services.RoleDelegationPolicy.Restore.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.restore();
        }
    }
}
