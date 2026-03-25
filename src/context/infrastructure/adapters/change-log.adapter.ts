import { ChangeSetType, FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { AccessControlEntityType } from "~context/enums";
import { MikroAdapter } from "~infrastructure/database/utils";
import { ChangeLog } from "~common/tracking";

export class ChangeLogAdapter {
    protected buildWhereORM(
        filters: Repositories.ChangeLog.Filters,
        basic: ObjectQuery<ChangeLog> = {},
    ): ObjectQuery<ChangeLog> {
        const where: ObjectQuery<ChangeLog> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.auditEntry) {
            where.auditEntry = MikroAdapter.applyStringFilter(filters.auditEntry);
        }
        if (filters.entity) {
            where.entity = MikroAdapter.applyStringFilter(filters.entity);
        }
        if (filters.changeType) {
            where.changeType = MikroAdapter.applyStringFilter<ChangeSetType>(filters.changeType);
        }
        if (filters.entityType) {
            where.entityType = MikroAdapter.applyStringFilter<AccessControlEntityType>(filters.entityType);
        }
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.ChangeLog.Sort,
        pagination: Pagination,
        basic: FindOptions<ChangeLog, P, F> = {},
    ): FindOptions<ChangeLog, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<ChangeLog>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
