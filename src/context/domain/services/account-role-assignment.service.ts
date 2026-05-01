import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccountRoleAssignment } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    ROLE_DELEGATION_POLICY_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentService implements Services.AccountRoleAssignment.Contract {
    private readonly dictionaryPath = "services.account-role-assignment";

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.InternalContract,
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.InternalContract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.InternalContract,
    ) {}

    public async create({ transaction, input, realm, actor }: Services.AccountRoleAssignment.Create): Promise<void> {
        const roleIds = input.roles.map(({ id }) => id!);
        const [isDelegationAllowed, limitExceeded, hasSoDViolations] = await Promise.all([
            this.roleDelegationPolicyRepository.isDelegationAllowed({
                realm: realm.id,
                roles: roleIds,
                transaction,
                actor,
            }),
            this.accountRoleAssignmentRepository.wouldExceedRoleLimit({
                account: input.account,
                roles: roleIds,
                transaction,
            }),
            this.roleConflictGroupRepository.hasViolations({
                account: input.account,
                realm: realm.id,
                roles: roleIds,
                transaction,
            }),
        ]);

        if (!isDelegationAllowed) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.DELEGATION_NOT_ALLOWED`);
        } else if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.ACCOUNT_ROLE_LIMIT_EXCEEDED`);
        } else if (hasSoDViolations) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.HAS_SoD_VIOLATIONS`);
        } else {
            for (const role of input.roles) {
                const entity = new AccountRoleAssignment({
                    account: input.account,
                    realm,
                    role,
                });

                entity.canAssign();

                transaction.persist(entity);
            }
        }
    }

    public purge({ transaction, entities }: Services.AccountRoleAssignment.Purge): void {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ entities }: Services.AccountRoleAssignment.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.AccountRoleAssignment.Restore): void {
        for (const entity of entities) {
            entity.restore();
        }
    }

    public assign({ transaction, input }: Services.AccountRoleAssignment.Assign): void {
        transaction.persist(new AccountRoleAssignment(input));
    }
}
