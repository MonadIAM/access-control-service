import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class AccountRoleAssignmentMapper implements Repositories.Mappers.Contract<
    Entities.AccountRoleAssignment,
    Repositories.Mappers.AccountRoleAssignment.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.AccountRoleAssignment.Filters,
        basic: ORM.ObjectQuery<Entities.AccountRoleAssignment> = {},
    ): ORM.ObjectQuery<Entities.AccountRoleAssignment> {
        const where: ORM.ObjectQuery<Entities.AccountRoleAssignment> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.account) {
            where.account = ORMAdapter.applyStringFilter(filters.account);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.role) {
            where.role = ORMAdapter.applyStringFilter(filters.role);
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
        sort: Repositories.Mappers.AccountRoleAssignment.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.AccountRoleAssignment, P, F> = {},
    ): ORM.FindOptions<Entities.AccountRoleAssignment, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.AccountRoleAssignment>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
