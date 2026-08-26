import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_GROUP_REPOSITORY, ROLE_CONFLICT_MEMBER_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { RoleConflictMember } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberService implements Services.RoleConflictMember.Contract {
    private readonly dictionaryPath = "services.role-conflict-member";

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.PublicContract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.PublicContract,
    ) {}

    public async create(props: Services.RoleConflictMember.Create.Props): Services.RoleConflictMember.Create.Result {
        const { transaction, input } = props;
        input.group.canModifyMembers();

        const limitExceeded = await this.roleConflictMemberRepository.wouldExceedMemberLimit({
            count: input.roles.length,
            group: input.group.id,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED` });
        } else {
            const identifiers = [
                ...input.group.members.getItems().map((member) => member.role.id),
                ...input.roles.map((role) => role.id),
            ];

            const hasViolators = await this.roleConflictGroupRepository.hasAccountsViolatingRule({
                maxAllowed: input.group.maxAllowed,
                realm: input.group.realm.id,
                transaction,
                identifiers,
            });

            if (hasViolators) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.HAS_ACCOUNTS_VIOLATING_RULE` });
            } else {
                for (const role of input.roles) {
                    transaction.persist(new RoleConflictMember({ group: input.group, role }));
                }
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
