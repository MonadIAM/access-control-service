import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class RoleConflictGroupAdapter
    implements Adapters.Contract<Entities.RoleConflictGroup, Adapters.RoleConflictGroup.Types>
{
    public buildWhereORM(
        filters: Adapters.RoleConflictGroup.Filters,
        basic: ORM.ObjectQuery<Entities.RoleConflictGroup> = {},
    ): ORM.ObjectQuery<Entities.RoleConflictGroup> {
        const where: ORM.ObjectQuery<Entities.RoleConflictGroup> = basic;

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

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.RoleConflictGroup.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.RoleConflictGroup, P, F> = {},
    ): ORM.FindOptions<Entities.RoleConflictGroup, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.RoleConflictGroup>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
