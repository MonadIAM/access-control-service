import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentQuery implements Queries.RolePermissionAssignment.Contract {
    private readonly populate = {
        DETAILED: ["permission", "realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.Contract,
    ) {}

    public findUnique(
        props: Queries.RolePermissionAssignment.FindUnique,
    ): Promise<Queries.RolePermissionAssignment.Entity> {
        return this.rolePermissionAssignmentRepository.findUniqueOrThrow({
            where: { id: props.assignment, realm: props.realm },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(
        props: Queries.RolePermissionAssignment.FindMany,
    ): Promise<[Queries.RolePermissionAssignment.Entity[], number]> {
        return this.rolePermissionAssignmentRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            filters: props.filters,
            realm: props.realm,
            sort: props.sort,
        });
    }
}
