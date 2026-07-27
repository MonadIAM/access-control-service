import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { InviteStatus } from "~context/enums";

export class InviteAdapter implements Adapters.Contract<Entities.Invite, Adapters.Invite.Types> {
    public buildWhereORM(
        filters: Adapters.Invite.Filters,
        basic: ORM.ObjectQuery<Entities.Invite> = {},
    ): ORM.ObjectQuery<Entities.Invite> {
        const where: ORM.ObjectQuery<Entities.Invite> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.status) {
            where.status = MikroAdapter.applyStringFilter<InviteStatus>(filters.status);
        }
        if (filters.invitee) {
            where.invitee = MikroAdapter.applyStringFilter(filters.invitee);
        }
        if (filters.inviter) {
            where.inviter = MikroAdapter.applyStringFilter(filters.inviter);
        }
        if (filters.role) {
            where.role = MikroAdapter.applyStringFilter(filters.role);
        }
        if (filters.realm) {
            where.realm = MikroAdapter.applyStringFilter(filters.realm);
        }
        if (filters.updatedAt) {
            where.updatedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
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
            orderBy: MikroAdapter.orderBy<Entities.Invite>(sort, { createdAt: QueryOrder.DESC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
