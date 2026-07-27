import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { ChangeLog } from "~common/transaction-manager";
import { EntityType } from "~context/enums";

export class ChangeLogAdapter implements Adapters.Contract<ChangeLog, Adapters.ChangeLog.Types> {
    public buildWhereORM(
        filters: Adapters.ChangeLog.Filters,
        basic: ORM.ObjectQuery<ChangeLog> = {},
    ): ORM.ObjectQuery<ChangeLog> {
        const where: ORM.ObjectQuery<ChangeLog> = basic;

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
            where.changeType = MikroAdapter.applyStringFilter<ORM.ChangeSetType>(filters.changeType);
        }
        if (filters.entityType) {
            where.entityType = MikroAdapter.applyStringFilter<EntityType>(filters.entityType);
        }
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.ChangeLog.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<ChangeLog, P, F> = {},
    ): ORM.FindOptions<ChangeLog, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<ChangeLog>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
