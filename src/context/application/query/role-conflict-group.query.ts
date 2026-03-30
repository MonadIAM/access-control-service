import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_GROUP_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupQuery implements Queries.RoleConflictGroup.Contract {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
    ) {}

    public findUnique(props: Queries.RoleConflictGroup.FindUnique): Promise<Queries.RoleConflictGroup.Entity> {
        return this.roleConflictGroupRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.group, realm: props.realm },
        });
    }

    public findMany(props: Queries.RoleConflictGroup.FindMany): Promise<[Queries.RoleConflictGroup.Entity[], number]> {
        return this.roleConflictGroupRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            filters: props.filters,
            realm: props.realm,
            sort: props.sort,
        });
    }

    public findViolationDetails(
        props: Queries.RoleConflictGroup.FindViolationDetails,
    ): Promise<Queries.RoleConflictGroup.Entity[]> {
        return this.roleConflictGroupRepository.findViolationDetails({
            account: props.account,
            roles: props.roles,
            realm: props.realm,
        });
    }
}
