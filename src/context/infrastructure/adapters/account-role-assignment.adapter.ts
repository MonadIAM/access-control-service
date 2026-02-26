import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { AccountRoleAssignment } from "~context/domain/entities";
import { MikroAdapter } from "~infrastructure/database/utils";

export class AccountRoleAssignmentAdapter {
    protected buildWhereORM(
        filters: Repositories.AccountRoleAssignment.Filters,
        basic: ObjectQuery<AccountRoleAssignment> = {},
    ): ObjectQuery<AccountRoleAssignment> {
        const where: ObjectQuery<AccountRoleAssignment> = basic;

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

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.AccountRoleAssignment.Sort,
        pagination: Pagination,
        basic: FindOptions<AccountRoleAssignment, P, F> = {},
    ): FindOptions<AccountRoleAssignment, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<AccountRoleAssignment>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
