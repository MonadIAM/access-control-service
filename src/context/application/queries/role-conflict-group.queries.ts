import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_GROUP_REPOSITORY } from "~context/domain/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupQueries implements Queries.RoleConflictGroup.Contract {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.QueryContract,
    ) {}

    public findUnique(props: Queries.RoleConflictGroup.FindUnique.Props): Queries.RoleConflictGroup.FindUnique.Result {
        return this.roleConflictGroupRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.group, realm: props.realm },
        });
    }

    public findMany(props: Queries.RoleConflictGroup.FindMany.Props): Queries.RoleConflictGroup.FindMany.Result {
        return this.roleConflictGroupRepository.findMany({
            options: { populate: this.populate[props.view] },
            prefilter: { realm: props.realm },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }

    public findViolationDetails(
        props: Queries.RoleConflictGroup.FindViolationDetails.Props,
    ): Queries.RoleConflictGroup.FindViolationDetails.Result {
        return this.roleConflictGroupRepository.findViolationDetails({
            account: props.account,
            roles: props.roles,
            realm: props.realm,
        });
    }
}
