import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { RolePermissionMatrix } from "~context/domain/entities";

export class RolePermissionMatrixAdapter {
    protected buildWhereORM(
        filters: Repositories.RolePermissionMatrix.Filters,
        basic: ObjectQuery<RolePermissionMatrix> = {},
    ): ObjectQuery<RolePermissionMatrix> {
        const where: ObjectQuery<RolePermissionMatrix> = basic;

        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }

        if (filters.permission) {
            where.permission = MikroAdapter.applyStringFilter(filters.permission);
        }
        if (filters.role) {
            where.role = MikroAdapter.applyStringFilter(filters.role);
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.RolePermissionMatrix.Sort,
        pagination: Pagination,
        basic: FindOptions<RolePermissionMatrix, P, F> = {},
    ): FindOptions<RolePermissionMatrix, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<RolePermissionMatrix>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
