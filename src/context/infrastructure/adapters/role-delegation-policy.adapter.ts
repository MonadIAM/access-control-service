import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { RoleDelegationPolicy } from "~context/domain/entities";

export class RoleDelegationPolicyAdapter {
    protected buildWhereORM(
        filters: Repositories.RoleDelegationPolicy.Filters,
        basic: ObjectQuery<RoleDelegationPolicy> = {},
    ): ObjectQuery<RoleDelegationPolicy> {
        const where: ObjectQuery<RoleDelegationPolicy> = basic;

        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }

        if (filters.delegator) {
            where.delegator = MikroAdapter.applyStringFilter(filters.delegator);
        }
        if (filters.target) {
            where.target = MikroAdapter.applyStringFilter(filters.target);
        }
        if (filters.realm) {
            where.realm = MikroAdapter.applyStringFilter(filters.realm);
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.RoleDelegationPolicy.Sort,
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
