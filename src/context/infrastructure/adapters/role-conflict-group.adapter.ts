import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { RoleConflictGroup } from "~context/domain/entities";

export class RoleConflictGroupAdapter {
    protected buildWhereORM(
        filters: Repositories.RoleConflictGroup.Filters,
        basic: ObjectQuery<RoleConflictGroup> = {},
    ): ObjectQuery<RoleConflictGroup> {
        const where: ObjectQuery<RoleConflictGroup> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.maxAllowed) {
            where.maxAllowed = MikroAdapter.applyOrdinalFilter<number>(filters.maxAllowed);
        }
        if (filters.code) {
            where.code = MikroAdapter.applyStringFilter(filters.code);
        }
        if (filters.name) {
            where.name = MikroAdapter.applyStringFilter(filters.name);
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
        sort: Repositories.RoleConflictGroup.Sort,
        pagination: Pagination,
        basic: FindOptions<RoleConflictGroup, P, F> = {},
    ): FindOptions<RoleConflictGroup, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<RoleConflictGroup>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
