import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_DELEGATION_POLICY_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyQuery implements Queries.RoleDelegationPolicy.Contract {
    private readonly populate = {
        DETAILED: ["delegator", "target", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleDelegationPolicy.ExternalContract,
    ) {}

    public findUnique(props: Queries.RoleDelegationPolicy.FindUnique): Promise<Queries.RoleDelegationPolicy.Entity> {
        return this.roleConflictGroupRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.policy, realm: props.realm },
        });
    }

    public findMany(
        props: Queries.RoleDelegationPolicy.FindMany,
    ): Promise<[Queries.RoleDelegationPolicy.Entity[], number]> {
        return this.roleConflictGroupRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            filters: props.filters,
            realm: props.realm,
            sort: props.sort,
        });
    }
}
