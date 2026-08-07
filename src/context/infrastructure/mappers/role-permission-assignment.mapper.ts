import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class RolePermissionAssignmentMapper implements Repositories.Mappers.Contract<
    Entities.RolePermissionAssignment,
    Repositories.Mappers.RolePermissionAssignment.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.RolePermissionAssignment.Filters,
        basic: ORM.ObjectQuery<Entities.RolePermissionAssignment> = {},
    ): ORM.ObjectQuery<Entities.RolePermissionAssignment> {
        const where: ORM.ObjectQuery<Entities.RolePermissionAssignment> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.role) {
            where.role = ORMAdapter.applyStringFilter(filters.role);
        }
        if (filters.permission) {
            where.permission = ORMAdapter.applyStringFilter(filters.permission);
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.RolePermissionAssignment.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.RolePermissionAssignment, P, F> = {},
    ): ORM.FindOptions<Entities.RolePermissionAssignment, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.RolePermissionAssignment>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
