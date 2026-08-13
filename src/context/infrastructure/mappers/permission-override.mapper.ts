import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";
import { PermissionOverrideEffect } from "~context/enums";

export class PermissionOverrideMapper implements Repositories.Mappers.Contract<
    Entities.PermissionOverride,
    Repositories.Mappers.PermissionOverride.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.PermissionOverride.Filters,
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
        if (filters.justification) {
            where.justification = ORMAdapter.applyStringFilter(filters.justification);
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
        if (filters.expiresAt) {
            where.expiresAt = ORMAdapter.applyOrdinalFilter<Date>(filters.expiresAt);
        }
        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.PermissionOverride.Sort,
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
