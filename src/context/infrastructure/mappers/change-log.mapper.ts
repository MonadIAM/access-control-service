import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";
import { ChangeLog } from "~common/transaction-manager";
import { EntityType } from "~context/enums";

export class ChangeLogMapper implements Repositories.Mappers.Contract<ChangeLog, Repositories.Mappers.ChangeLog.Types> {
    public buildWhereORM(
        filters: Repositories.Mappers.ChangeLog.Filters,
        basic: ORM.ObjectQuery<ChangeLog> = {},
    ): ORM.ObjectQuery<ChangeLog> {
        const where: ORM.ObjectQuery<ChangeLog> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.auditEntry) {
            where.auditEntry = ORMAdapter.applyStringFilter(filters.auditEntry);
        }
        if (filters.entity) {
            where.entity = ORMAdapter.applyStringFilter(filters.entity);
        }
        if (filters.changeType) {
            where.changeType = ORMAdapter.applyStringFilter<ORM.ChangeSetType>(filters.changeType);
        }
        if (filters.entityType) {
            where.entityType = ORMAdapter.applyStringFilter<EntityType>(filters.entityType);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.ChangeLog.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<ChangeLog, P, F> = {},
    ): ORM.FindOptions<ChangeLog, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<ChangeLog>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
