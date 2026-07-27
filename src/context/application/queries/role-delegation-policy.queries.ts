import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_DELEGATION_POLICY_REPOSITORY } from "~context/domain/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyQueries implements Queries.RoleDelegationPolicy.Contract {
    private readonly populate = {
        DETAILED: ["delegator", "target", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleDelegationPolicy.QueryContract,
    ) {}

    public findUnique(
        props: Queries.RoleDelegationPolicy.FindUnique.Props,
    ): Queries.RoleDelegationPolicy.FindUnique.Result {
        return this.roleConflictGroupRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.policy, realm: props.realm },
        });
    }

    public findMany(props: Queries.RoleDelegationPolicy.FindMany.Props): Queries.RoleDelegationPolicy.FindMany.Result {
        return this.roleConflictGroupRepository.findMany({
            options: { populate: this.populate[props.view] },
            prefilter: { realm: props.realm },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }
}
