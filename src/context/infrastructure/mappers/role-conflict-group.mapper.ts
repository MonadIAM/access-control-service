import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class RoleConflictGroupMapper implements Repositories.Mappers.Contract<
    Entities.RoleConflictGroup,
    Repositories.Mappers.RoleConflictGroup.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.RoleConflictGroup.Filters,
        basic: ORM.ObjectQuery<Entities.RoleConflictGroup> = {},
    ): ORM.ObjectQuery<Entities.RoleConflictGroup> {
        const where: ORM.ObjectQuery<Entities.RoleConflictGroup> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.maxAllowed) {
            where.maxAllowed = ORMAdapter.applyOrdinalFilter<number>(filters.maxAllowed);
        }
        if (filters.code) {
            where.code = ORMAdapter.applyStringFilter(filters.code);
        }
        if (filters.name) {
            where.name = ORMAdapter.applyStringFilter(filters.name);
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
        sort: Repositories.Mappers.RoleConflictGroup.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.RoleConflictGroup, P, F> = {},
    ): ORM.FindOptions<Entities.RoleConflictGroup, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.RoleConflictGroup>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
