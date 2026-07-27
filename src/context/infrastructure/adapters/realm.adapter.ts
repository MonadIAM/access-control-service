import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class RealmAdapter implements Adapters.Contract<Entities.Realm, Adapters.Realm.Types> {
    public buildWhereORM(
        filters: Adapters.Realm.Filters,
        basic: ORM.ObjectQuery<Entities.Realm> = {},
    ): ORM.ObjectQuery<Entities.Realm> {
        const where: ORM.ObjectQuery<Entities.Realm> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.code) {
            where.code = MikroAdapter.applyStringFilter(filters.code);
        }
        if (filters.name) {
            where.name = MikroAdapter.applyStringFilter(filters.name);
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
        sort: Adapters.Realm.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Realm, P, F> = {},
    ): ORM.FindOptions<Entities.Realm, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Realm>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
