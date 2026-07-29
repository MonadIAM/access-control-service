import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";
import { ActionType, EntityType } from "~context/enums";
import { AuditLog } from "~common/transaction-manager";

export class AuditLogAdapter implements Adapters.Contract<AuditLog, Adapters.AuditLog.Types> {
    public buildWhereORM(
        filters: Adapters.AuditLog.Filters,
        basic: ORM.ObjectQuery<AuditLog> = {},
    ): ORM.ObjectQuery<AuditLog> {
        const where: ORM.ObjectQuery<AuditLog> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.actor) {
            where.actor = ORMAdapter.applyStringFilter(filters.actor);
        }
        if (filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
        }
        if (filters.ip) {
            where.ip = ORMAdapter.applyStringFilter(filters.ip);
        }
        if (filters.userAgent) {
            where.userAgent = ORMAdapter.applyStringFilter(filters.userAgent);
        }
        if (filters.actionType) {
            where.actionType = ORMAdapter.applyStringFilter<ActionType>(filters.actionType);
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
        sort: Adapters.AuditLog.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<AuditLog, P, F> = {},
    ): ORM.FindOptions<AuditLog, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<AuditLog>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
