import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { MikroAdapter } from "~infrastructure/database/utils";
import { AuditJournal } from "~context/domain/entities";

export class AuditJournalAdapter {
    protected buildWhereORM(
        filters: Repositories.AuditJournal.Filters,
        basic: ObjectQuery<AuditJournal> = {},
    ): ObjectQuery<AuditJournal> {
        const where: ObjectQuery<AuditJournal> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }

        if (filters.entity) {
            where.entityId = MikroAdapter.applyStringFilter(filters.entity);
        }
        if (filters.realm) {
            where.realmId = MikroAdapter.applyStringFilter(filters.realm);
        }
        if (filters.by) {
            where.by = MikroAdapter.applyStringFilter(filters.by);
        }

        if (filters.actionType) {
            where.action = MikroAdapter.applyStringFilter<AccessControlActionType>(filters.actionType);
        }
        if (filters.entityType) {
            where.entity = MikroAdapter.applyStringFilter<AccessControlEntityType>(filters.entityType);
        }

        if (filters.at) {
            where.at = MikroAdapter.applyOrdinalFilter<Date>(filters.at);
        }
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.AuditJournal.Sort,
        pagination: Pagination,
        basic: FindOptions<AuditJournal, P, F> = {},
    ): FindOptions<AuditJournal, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<AuditJournal>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
