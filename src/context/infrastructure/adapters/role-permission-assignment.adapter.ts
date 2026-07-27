import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class RolePermissionAssignmentAdapter
    implements Adapters.Contract<Entities.RolePermissionAssignment, Adapters.RolePermissionAssignment.Types>
{
    public buildWhereORM(
        filters: Adapters.RolePermissionAssignment.Filters,
        basic: ORM.ObjectQuery<Entities.RolePermissionAssignment> = {},
    ): ORM.ObjectQuery<Entities.RolePermissionAssignment> {
        const where: ORM.ObjectQuery<Entities.RolePermissionAssignment> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.role) {
            where.role = MikroAdapter.applyStringFilter(filters.role);
        }
        if (filters.permission) {
            where.permission = MikroAdapter.applyStringFilter(filters.permission);
        }
        if (filters.updatedAt) {
            where.updatedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.RolePermissionAssignment.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.RolePermissionAssignment, P, F> = {},
    ): ORM.FindOptions<Entities.RolePermissionAssignment, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.RolePermissionAssignment>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
