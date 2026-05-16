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
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.Contract,
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
    ) {}

    public async create(props: Services.AccountRoleAssignment.Create.Props): Services.AccountRoleAssignment.Create.Result {
        const { transaction, input, realm, actor } = props;
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
            const entities: Entities.AccountRoleAssignment[] = [];
            for (const role of input.roles) {
                const entity = new AccountRoleAssignment({
                    account: input.account,
                    realm,
                    role,
                });

                entity.canAssign();
                entities.push(entity);
                transaction.persist(entity);
            }
            return entities;
        }
    }

    public purge(props: Services.AccountRoleAssignment.Purge.Props): Services.AccountRoleAssignment.Purge.Result {
        const { transaction, entities } = props;
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke(props: Services.AccountRoleAssignment.Revoke.Props): Services.AccountRoleAssignment.Revoke.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.AccountRoleAssignment.Restore.Props): Services.AccountRoleAssignment.Restore.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.restore();
        }
    }

    public assign(props: Services.AccountRoleAssignment.Assign.Props): Services.AccountRoleAssignment.Assign.Result {
        const { transaction, input } = props;
        const entity = new AccountRoleAssignment(input);
        transaction.persist(entity);
        return entity;
    }
}
