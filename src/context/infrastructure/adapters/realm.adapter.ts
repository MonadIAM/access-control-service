import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Realm } from "~context/domain/entities";

export class RealmAdapter implements Adapters.Contract<Realm, Adapters.Realm.Types> {
    public buildWhereORM(filters: Adapters.Realm.Filters, basic: ObjectQuery<Realm> = {}): ObjectQuery<Realm> {
        const where: ObjectQuery<Realm> = basic;

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
        basic: FindOptions<Realm, P, F> = {},
    ): FindOptions<Realm, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Realm>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
