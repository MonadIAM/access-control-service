import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "~context/domain/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentQueries implements Queries.RolePermissionAssignment.Contract {
    private readonly populate = {
        DETAILED: ["permission", "realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.QueryContract,
    ) {}

    public findUnique(
        props: Queries.RolePermissionAssignment.FindUnique.Props,
    ): Queries.RolePermissionAssignment.FindUnique.Result {
        return this.rolePermissionAssignmentRepository.findUniqueOrThrow({
            where: { id: props.assignment, realm: props.realm },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(
        props: Queries.RolePermissionAssignment.FindMany.Props,
    ): Queries.RolePermissionAssignment.FindMany.Result {
        return this.rolePermissionAssignmentRepository.findMany({
            options: { populate: this.populate[props.view] },
            prefilter: { realm: props.realm },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }
}
