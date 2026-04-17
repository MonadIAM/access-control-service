import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { RoleDelegationPolicy } from "~context/domain/entities";

export class RoleDelegationPolicyAdapter
    implements Adapters.Contract<RoleDelegationPolicy, Adapters.RoleDelegationPolicy.Types>
{
    public buildWhereORM(
        filters: Adapters.RoleDelegationPolicy.Filters,
        basic: ObjectQuery<RoleDelegationPolicy> = {},
    ): ObjectQuery<RoleDelegationPolicy> {
        const where: ObjectQuery<RoleDelegationPolicy> = basic;

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
        basic: FindOptions<RoleDelegationPolicy, P, F> = {},
    ): FindOptions<RoleDelegationPolicy, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<RoleDelegationPolicy>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
