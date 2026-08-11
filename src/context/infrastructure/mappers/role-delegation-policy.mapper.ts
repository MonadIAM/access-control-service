import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class RoleDelegationPolicyMapper implements Repositories.Mappers.Contract<
    Entities.RoleDelegationPolicy,
    Repositories.Mappers.RoleDelegationPolicy.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.RoleDelegationPolicy.Filters,
        basic: ORM.ObjectQuery<Entities.RoleDelegationPolicy> = {},
    ): ORM.ObjectQuery<Entities.RoleDelegationPolicy> {
        const where: ORM.ObjectQuery<Entities.RoleDelegationPolicy> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
        }
        if (filters.delegator) {
            where.delegator = ORMAdapter.applyStringFilter(filters.delegator);
        }
        if (filters.target) {
            where.target = ORMAdapter.applyStringFilter(filters.target);
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
        sort: Repositories.Mappers.RoleDelegationPolicy.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.RoleDelegationPolicy, P, F> = {},
    ): ORM.FindOptions<Entities.RoleDelegationPolicy, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.RoleDelegationPolicy>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
