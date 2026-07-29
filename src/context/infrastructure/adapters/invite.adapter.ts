import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";
import { InviteStatus } from "~context/enums";

export class InviteAdapter implements Adapters.Contract<Entities.Invite, Adapters.Invite.Types> {
    public buildWhereORM(
        filters: Adapters.Invite.Filters,
        basic: ORM.ObjectQuery<Entities.Invite> = {},
    ): ORM.ObjectQuery<Entities.Invite> {
        const where: ORM.ObjectQuery<Entities.Invite> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.status) {
            where.status = ORMAdapter.applyStringFilter<InviteStatus>(filters.status);
        }
        if (filters.invitee) {
            where.invitee = ORMAdapter.applyStringFilter(filters.invitee);
        }
        if (filters.inviter) {
            where.inviter = ORMAdapter.applyStringFilter(filters.inviter);
        }
        if (filters.role) {
            where.role = ORMAdapter.applyStringFilter(filters.role);
        }
        if (filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Invite.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Invite, P, F> = {},
    ): ORM.FindOptions<Entities.Invite, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Invite>(sort, { createdAt: QueryOrder.DESC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
