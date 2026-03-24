import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_MEMBER_REPOSITORY } from "~context/infrastructure/repositories";
import { RoleConflictMember } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberService implements Services.RoleConflictMember.Contract {
    private readonly dictionaryPath = "services.role-conflict-member";

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.Contract,
    ) {}

    public async create({ transaction, input, actor }: Services.RoleConflictMember.Create): Promise<void> {
        const limitExceeded = await this.roleConflictMemberRepository.wouldExceedMemberLimit({
            count: input.roles.length,
            group: input.group.id,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED`);
        } else {
            for (const role of input.roles) {
                transaction.persist(
                    new RoleConflictMember({
                        group: input.group,
                        actor,
                        role,
                    }),
                );
            }
        }
    }

    public purge({ transaction, input }: Services.RoleConflictMember.Purge): void {
        transaction.clear();
        for (const entity of input.entities) {
            entity.canPurge();

            transaction.remove(entity);
        }
    }
}
