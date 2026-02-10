import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { PermissionOverride } from "~context/domain/entities";
import { PermissionOverrideEffect } from "~context/enums";

export class PermissionOverrideAdapter {
    protected buildWhereORM(
        filters: Repositories.PermissionOverride.Filters,
        basic: ObjectQuery<PermissionOverride> = {},
    ): ObjectQuery<PermissionOverride> {
        const where: ObjectQuery<PermissionOverride> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.account) {
            where.accountId = MikroAdapter.applyStringFilter(filters.account);
        }
        if (filters.effect) {
            where.effect = MikroAdapter.applyStringFilter<PermissionOverrideEffect>(filters.effect);
        }
        if (filters.permission) {
            where.permission = MikroAdapter.applyStringFilter(filters.permission);
        }
        if (filters.realm) {
            where.realm = MikroAdapter.applyStringFilter(filters.realm);
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
