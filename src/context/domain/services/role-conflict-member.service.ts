import { Inject, Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";
import {
    ROLE_CONFLICT_MEMBER_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

import { RoleConflictMember } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberService implements Services.RoleConflictMember.Contract {
    private readonly dictionaryPath = "services.role-conflict-member";

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.PublicContract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
    ) {}

    public async create(props: Services.RoleConflictMember.Create.Props): Services.RoleConflictMember.Create.Result {
        const { transaction, input, realm } = props;
        const [roles, group] = await Promise.all([
            this.roleRepository.find({
                where: { id: { $in: input.roles }, realm },
                transaction,
            }),
            this.roleConflictGroupRepository.findUniqueOrThrow({
                options: { populate: ["members", "members.role"] },
                where: { id: input.group, realm },
                transaction,
            }),
        ]);

        if (roles.length < input.roles.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ROLES_NOT_FOUND` });
        } else {
            group.canModifyMembers();

            const existingIdentifiers = group.members.getItems().map((member) => member.role.id);
            const newRoles = roles.filter((role) => !existingIdentifiers.includes(role.id));

            const limitExceeded = await this.roleConflictMemberRepository.wouldExceedMemberLimit({
                count: newRoles.length,
                group: group.id,
                transaction,
            });

            if (limitExceeded) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED` });
            } else {
                const identifiers = [...existingIdentifiers, ...newRoles.map((role) => role.id)];

                const hasViolators = await this.roleConflictGroupRepository.hasAccountsViolatingRule({
                    maxAllowed: group.maxAllowed,
                    realm: group.realm.id,
                    transaction,
                    identifiers,
                });

                if (hasViolators) {
                    throw Exception.invariantViolation({
                        messageKey: `${this.dictionaryPath}.HAS_ACCOUNTS_VIOLATING_RULE`,
                    });
                } else {
                    for (const role of newRoles) {
                        transaction.persist(new RoleConflictMember({ group, role }));
                    }
                }
            }
        }
    }

    public async purge(props: Services.RoleConflictMember.Purge.Props): Services.RoleConflictMember.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.roleConflictMemberRepository.find({
            where: { id: { $in: unique }, group: { realm } },
            options: { populate: ["group"] },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.MEMBERS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.canPurge();

                transaction.remove(entity);
            }

            return entities;
        }
    }
}
