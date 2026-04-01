import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentQueries implements Queries.AccountRoleAssignment.Contract {
    private readonly populate = {
        DETAILED: ["realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.ExternalContract,
    ) {}

    public findUnique(props: Queries.AccountRoleAssignment.FindUnique): Promise<Queries.AccountRoleAssignment.Entity> {
        return this.accountRoleAssignmentRepository.findUniqueOrThrow({
            where: { id: props.assignment, realm: props.realm },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(
        props: Queries.AccountRoleAssignment.FindMany,
    ): Promise<[Queries.AccountRoleAssignment.Entity[], number]> {
        return this.accountRoleAssignmentRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            filters: props.filters,
            realm: props.realm,
            sort: props.sort,
        });
    }
}
