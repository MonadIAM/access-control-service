import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { RoleConflictMember } from "~context/domain/entities";

export class RoleConflictMemberAdapter {
    protected buildWhereORM(
        filters: Repositories.RoleConflictMember.Filters,
        basic: ObjectQuery<RoleConflictMember> = {},
    ): ObjectQuery<RoleConflictMember> {
        const where: ObjectQuery<RoleConflictMember> = basic;

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

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.RoleConflictMember.Sort,
        pagination: Pagination,
        basic: FindOptions<RoleConflictMember, P, F> = {},
    ): FindOptions<RoleConflictMember, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<RoleConflictMember>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
