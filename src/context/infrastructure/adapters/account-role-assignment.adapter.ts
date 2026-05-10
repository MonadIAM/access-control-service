import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class AccountRoleAssignmentAdapter
    implements Adapters.Contract<Entities.AccountRoleAssignment, Adapters.AccountRoleAssignment.Types>
{
    public buildWhereORM(
        filters: Adapters.AccountRoleAssignment.Filters,
        basic: ObjectQuery<Entities.AccountRoleAssignment> = {},
    ): ObjectQuery<Entities.AccountRoleAssignment> {
        const where: ObjectQuery<Entities.AccountRoleAssignment> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.account) {
            where.account = MikroAdapter.applyStringFilter(filters.account);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.role) {
            where.role = MikroAdapter.applyStringFilter(filters.role);
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
        sort: Adapters.AccountRoleAssignment.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.AccountRoleAssignment, P, F> = {},
    ): FindOptions<Entities.AccountRoleAssignment, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.AccountRoleAssignment>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
