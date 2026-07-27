import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { ActionType, EntityType } from "~context/enums";
import { AuditLog } from "~common/transaction-manager";

export class AuditLogAdapter implements Adapters.Contract<AuditLog, Adapters.AuditLog.Types> {
    public buildWhereORM(
        filters: Adapters.AuditLog.Filters,
        basic: ORM.ObjectQuery<AuditLog> = {},
    ): ORM.ObjectQuery<AuditLog> {
        const where: ORM.ObjectQuery<AuditLog> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.actor) {
            where.actor = MikroAdapter.applyStringFilter(filters.actor);
        }
        if (filters.realm) {
            where.realm = MikroAdapter.applyStringFilter(filters.realm);
        }
        if (filters.ip) {
            where.ip = MikroAdapter.applyStringFilter(filters.ip);
        }
        if (filters.userAgent) {
            where.userAgent = MikroAdapter.applyStringFilter(filters.userAgent);
        }
        if (filters.actionType) {
            where.actionType = MikroAdapter.applyStringFilter<ActionType>(filters.actionType);
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
        sort: Adapters.AuditLog.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<AuditLog, P, F> = {},
    ): ORM.FindOptions<AuditLog, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<AuditLog>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
