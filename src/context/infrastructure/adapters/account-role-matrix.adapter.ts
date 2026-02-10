import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { AccountRoleMatrix } from "~context/domain/entities";

export class AccountRoleMatrixAdapter {
    protected buildWhereORM(
        filters: Repositories.AccountRoleMatrix.Filters,
        basic: ObjectQuery<AccountRoleMatrix> = {},
    ): ObjectQuery<AccountRoleMatrix> {
        const where: ObjectQuery<AccountRoleMatrix> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.account) {
            where.accountId = MikroAdapter.applyStringFilter(filters.account);
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
        sort: Repositories.AccountRoleMatrix.Sort,
        pagination: Pagination,
        basic: FindOptions<AccountRoleMatrix, P, F> = {},
    ): FindOptions<AccountRoleMatrix, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<AccountRoleMatrix>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
