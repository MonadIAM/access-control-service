import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Realm } from "~context/domain/entities";

export class RealmAdapter {
    protected buildWhereORM(filters: Repositories.Realm.Filters, basic: ObjectQuery<Realm> = {}): ObjectQuery<Realm> {
        const where: ObjectQuery<Realm> = basic;

        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
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
        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Realm.Sort,
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
