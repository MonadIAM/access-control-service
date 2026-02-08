import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { PermissionOverride } from "~context/domain/entities";

export class PermissionOverrideAdapter {
    protected buildWhereORM(
        filters: Repositories.PermissionOverride.Filters,
        basic: ObjectQuery<PermissionOverride> = {},
    ): ObjectQuery<PermissionOverride> {
        const where: ObjectQuery<PermissionOverride> = basic;

        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }

        if (filters.permission) {
            where.permission = MikroAdapter.applyStringFilter(filters.permission);
        }
        if (filters.account) {
            where.accountId = MikroAdapter.applyStringFilter(filters.account);
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.PermissionOverride.Sort,
        pagination: Pagination,
        basic: FindOptions<PermissionOverride, P, F> = {},
    ): FindOptions<PermissionOverride, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<PermissionOverride>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
