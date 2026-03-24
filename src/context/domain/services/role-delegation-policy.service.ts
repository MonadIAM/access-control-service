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

    public async create({ transaction, realm, actor, input }: Services.RoleDelegationPolicy.Create): Promise<void> {
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
                actor,
            });

            entity.canCreate();
            transaction.persist(entity);
        }
    }

    public update({ input, actor }: Services.RoleDelegationPolicy.Update): void {
        input.entity.changeData({ ...input, actor });
    }

    public purge({ transaction, input }: Services.RoleDelegationPolicy.Purge): void {
        transaction.clear();
        for (const entity of input.entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ input, actor }: Services.RoleDelegationPolicy.Revoke): void {
        for (const entity of input.entities) {
            entity.revoke({ reason: input.reason, actor });
        }
    }

    public restore({ input, actor }: Services.RoleDelegationPolicy.Restore): void {
        for (const entity of input.entities) {
            entity.restore({ reason: input.reason, actor });
        }
    }
}
