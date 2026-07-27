import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter, KnexAdapter } from "~infrastructure/database/utils";
import { RoleActorType, RolePrototype } from "~context/enums";

export class RoleAdapter implements Adapters.Contract<Entities.Role, Adapters.Role.Types> {
    public buildWhereORM(
        filters: Adapters.Role.Filters,
        basic: ORM.ObjectQuery<Entities.Role> = {},
    ): ORM.ObjectQuery<Entities.Role> {
        const where: ORM.ObjectQuery<Entities.Role> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.actorType) {
            where.actorType = MikroAdapter.applyStringFilter<RoleActorType>(filters.actorType);
        }
        if (filters.prototype) {
            where.prototype = MikroAdapter.applyStringFilter<RolePrototype>(filters.prototype);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.nonDelegable !== undefined) {
            where.nonDelegable = { $eq: filters.nonDelegable };
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
        if (filters.permission) {
            where.permissionAssignments = { permission: MikroAdapter.applyStringFilter(filters.permission) };
        }
        if (filters.realm) {
            where.realm = MikroAdapter.applyStringFilter(filters.realm);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Role.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Role, P, F> = {},
    ): ORM.FindOptions<Entities.Role, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Role>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }

    public buildWhereKnex(query: ORM.QueryBuilder, filters: Adapters.Role.Filters, tableAlias: string): void {
        if (filters.realm) {
            KnexAdapter.applyStringFilter(query, filters.realm, `${tableAlias}.realm_id`);
        }
        if (filters.actorType) {
            KnexAdapter.applyStringFilter(query, filters.actorType, `${tableAlias}.actor_type`);
        }
        if (filters.prototype) {
            KnexAdapter.applyStringFilter(query, filters.prototype, `${tableAlias}.prototype`);
        }
        if (filters.code) {
            KnexAdapter.applyStringFilter(query, filters.code, `${tableAlias}.code`);
        }
        if (filters.name) {
            KnexAdapter.applyStringFilter(query, filters.name, `${tableAlias}.name`);
        }
        if (filters.id) {
            KnexAdapter.applyStringFilter(query, filters.id, `${tableAlias}.id`);
        }

        if (filters.updatedAt) {
            KnexAdapter.applyOrdinalFilter(query, filters.updatedAt, `${tableAlias}.updated_at`);
        }
        if (filters.createdAt) {
            KnexAdapter.applyOrdinalFilter(query, filters.createdAt, `${tableAlias}.created_at`);
        }

        if (filters.isSystemManaged !== undefined) {
            query.where(`${tableAlias}.is_system_managed`, filters.isSystemManaged);
        }
        if (filters.nonDelegable !== undefined) {
            query.where(`${tableAlias}.non_delegable`, filters.nonDelegable);
        }
        if (filters.isRevoked !== undefined) {
            query.where(`${tableAlias}.is_revoked`, filters.isRevoked);
        }
    }

    public buildOptionsKnex(
        query: ORM.QueryBuilder,
        sort: Adapters.Role.Sort,
        pagination: Pagination,
        tableAlias: string,
    ): void {
        KnexAdapter.orderBy(query, sort, tableAlias, ["created_at", QueryOrder.ASC]);
        KnexAdapter.pagination(query, pagination);
    }
}
