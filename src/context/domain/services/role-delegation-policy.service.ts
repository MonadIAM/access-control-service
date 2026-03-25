import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_DELEGATION_POLICY_REPOSITORY } from "~context/infrastructure/repositories";
import { RoleDelegationPolicy } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyService implements Services.RoleDelegationPolicy.Contract {
    private readonly dictionaryPath = "services.role-delegation-policy";

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
    ) {}

    public async create({ transaction, realm, input }: Services.RoleDelegationPolicy.Create): Promise<void> {
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
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else if (existsTransitivePath) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.EXISTS_TRANSITIVE_PATH`);
        } else {
            const entity = new RoleDelegationPolicy({
                description: input.description,
                depthLimit: input.depthLimit,
                delegator: input.delegator,
                target: input.target,
                realm,
            });

            entity.canCreate();
            transaction.persist(entity);
        }
    }

    public update({ entity, patch }: Services.RoleDelegationPolicy.Update): void {
        entity.update({ patch });
    }

    public purge({ transaction, entities }: Services.RoleDelegationPolicy.Purge): void {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ entities }: Services.RoleDelegationPolicy.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.RoleDelegationPolicy.Restore): void {
        for (const entity of entities) {
            entity.restore();
        }
    }
}
