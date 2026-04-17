import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_GROUP_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupQueries implements Queries.RoleConflictGroup.Contract {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.ExternalContract,
    ) {}

    public findUnique(
        props: Queries.RoleConflictGroup.FindUnique.Props,
    ): Promise<Queries.RoleConflictGroup.FindUnique.Result> {
        return this.roleConflictGroupRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.group, realm: props.realm },
        });
    }

    public findMany(props: Queries.RoleConflictGroup.FindMany.Props): Promise<Queries.RoleConflictGroup.FindMany.Result> {
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
    ): Promise<Queries.RoleConflictGroup.FindViolationDetails.Result> {
        return this.roleConflictGroupRepository.findViolationDetails({
            account: props.account,
            roles: props.roles,
            realm: props.realm,
        });
    }
}
