import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_MEMBER_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberQueries implements Queries.RoleConflictMember.Contract {
    private readonly populate = {
        DETAILED: ["group", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictMember.ExternalContract,
    ) {}

    public findUnique(props: Queries.RoleConflictMember.FindUnique): Promise<Queries.RoleConflictMember.Entity> {
        return this.roleConflictGroupRepository.findUniqueOrThrow({
            where: { id: props.member, group: { id: props.group, realm: props.realm } },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(props: Queries.RoleConflictMember.FindMany): Promise<[Queries.RoleConflictMember.Entity[], number]> {
        return this.roleConflictGroupRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            filters: props.filters,
            realm: props.realm,
            group: props.group,
            sort: props.sort,
        });
    }
}
