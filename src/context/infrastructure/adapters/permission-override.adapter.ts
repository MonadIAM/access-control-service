import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { PermissionOverrideEffect } from "~context/enums";

export class PermissionOverrideAdapter
    implements Adapters.Contract<Entities.PermissionOverride, Adapters.PermissionOverride.Types>
{
    public buildWhereORM(
        filters: Adapters.PermissionOverride.Filters,
        basic: ObjectQuery<Entities.PermissionOverride> = {},
    ): ObjectQuery<Entities.PermissionOverride> {
        const where: ObjectQuery<Entities.PermissionOverride> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.account) {
            where.account = MikroAdapter.applyStringFilter(filters.account);
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

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.PermissionOverride.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.PermissionOverride, P, F> = {},
    ): FindOptions<Entities.PermissionOverride, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.PermissionOverride>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
