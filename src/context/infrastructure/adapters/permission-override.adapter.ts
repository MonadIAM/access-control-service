import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";
import { PermissionOverrideEffect } from "~context/enums";

export class PermissionOverrideAdapter implements Adapters.Contract<
    Entities.PermissionOverride,
    Adapters.PermissionOverride.Types
> {
    public buildWhereORM(
        filters: Adapters.PermissionOverride.Filters,
        basic: ORM.ObjectQuery<Entities.PermissionOverride> = {},
    ): ORM.ObjectQuery<Entities.PermissionOverride> {
        const where: ORM.ObjectQuery<Entities.PermissionOverride> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.account) {
            where.account = ORMAdapter.applyStringFilter(filters.account);
        }
        if (filters.effect) {
            where.effect = ORMAdapter.applyStringFilter<PermissionOverrideEffect>(filters.effect);
        }
        if (filters.permission) {
            where.permission = ORMAdapter.applyStringFilter(filters.permission);
        }
        if (filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
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
        sort: Adapters.PermissionOverride.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.PermissionOverride, P, F> = {},
    ): ORM.FindOptions<Entities.PermissionOverride, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.PermissionOverride>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
