import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class RoleDelegationPolicyAdapter
    implements Adapters.Contract<Entities.RoleDelegationPolicy, Adapters.RoleDelegationPolicy.Types>
{
    public buildWhereORM(
        filters: Adapters.RoleDelegationPolicy.Filters,
        basic: ORM.ObjectQuery<Entities.RoleDelegationPolicy> = {},
    ): ORM.ObjectQuery<Entities.RoleDelegationPolicy> {
        const where: ORM.ObjectQuery<Entities.RoleDelegationPolicy> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.realm) {
            where.realm = MikroAdapter.applyStringFilter(filters.realm);
        }
        if (filters.delegator) {
            where.delegator = MikroAdapter.applyStringFilter(filters.delegator);
        }
        if (filters.target) {
            where.target = MikroAdapter.applyStringFilter(filters.target);
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
        sort: Adapters.RoleDelegationPolicy.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.RoleDelegationPolicy, P, F> = {},
    ): ORM.FindOptions<Entities.RoleDelegationPolicy, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.RoleDelegationPolicy>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
