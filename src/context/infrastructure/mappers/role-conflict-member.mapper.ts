import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class RoleConflictMemberMapper implements Repositories.Mappers.Contract<
    Entities.RoleConflictMember,
    Repositories.Mappers.RoleConflictMember.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.RoleConflictMember.Filters,
        basic: ORM.ObjectQuery<Entities.RoleConflictMember> = {},
    ): ORM.ObjectQuery<Entities.RoleConflictMember> {
        const where: ORM.ObjectQuery<Entities.RoleConflictMember> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.group) {
            where.group = ORMAdapter.applyStringFilter(filters.group);
        }
        if (filters.role) {
            where.role = ORMAdapter.applyStringFilter(filters.role);
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
        sort: Repositories.Mappers.RoleConflictMember.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.RoleConflictMember, P, F> = {},
    ): ORM.FindOptions<Entities.RoleConflictMember, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.RoleConflictMember>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
