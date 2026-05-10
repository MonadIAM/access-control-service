import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class RoleConflictMemberAdapter
    implements Adapters.Contract<Entities.RoleConflictMember, Adapters.RoleConflictMember.Types>
{
    public buildWhereORM(
        filters: Adapters.RoleConflictMember.Filters,
        basic: ObjectQuery<Entities.RoleConflictMember> = {},
    ): ObjectQuery<Entities.RoleConflictMember> {
        const where: ObjectQuery<Entities.RoleConflictMember> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.group) {
            where.group = MikroAdapter.applyStringFilter(filters.group);
        }
        if (filters.role) {
            where.role = MikroAdapter.applyStringFilter(filters.role);
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
        sort: Adapters.RoleConflictMember.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.RoleConflictMember, P, F> = {},
    ): FindOptions<Entities.RoleConflictMember, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.RoleConflictMember>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
