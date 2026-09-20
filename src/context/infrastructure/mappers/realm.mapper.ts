import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class RealmMapper implements Repositories.Mappers.Contract<Entities.Realm, Repositories.Mappers.Realm.Types> {
    public buildWhereORM(
        filters: Repositories.Mappers.Realm.Filters,
        basic: ORM.ObjectQuery<Entities.Realm> = {},
    ): ORM.ObjectQuery<Entities.Realm> {
        const where: ORM.ObjectQuery<Entities.Realm> = basic;

        if (filters.type !== undefined) {
            where.type = filters.type;
        }
        if (filters.isSystemRevoked !== undefined) {
            where.isSystemRevoked = filters.isSystemRevoked;
        }

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.code) {
            where.code = ORMAdapter.applyStringFilter(filters.code);
        }
        if (filters.name) {
            where.name = ORMAdapter.applyStringFilter(filters.name);
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
        sort: Repositories.Mappers.Realm.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Realm, P, F> = {},
    ): ORM.FindOptions<Entities.Realm, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Realm>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
