import { Inject, Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";

import { ROLE_CONFLICT_MEMBER_REPOSITORY } from "../repositories";
import { RoleConflictMember } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberService implements Services.RoleConflictMember.Contract {
    private readonly dictionaryPath = "services.role-conflict-member";

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.Contract,
    ) {}

    public async create(props: Services.RoleConflictMember.Create.Props): Services.RoleConflictMember.Create.Result {
        const { transaction, input } = props;
        const limitExceeded = await this.roleConflictMemberRepository.wouldExceedMemberLimit({
            count: input.roles.length,
            group: input.group.id,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED` });
        } else {
            for (const role of input.roles) {
                transaction.persist(new RoleConflictMember({ group: input.group, role }));
            }
        }
    }

    public purge(props: Services.RoleConflictMember.Purge.Props): Services.RoleConflictMember.Purge.Result {
        const { transaction, entities } = props;
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();

            transaction.remove(entity);
        }
    }
}
