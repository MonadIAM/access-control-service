import { FindOptions, Knex, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter, KnexAdapter } from "~infrastructure/database/utils";
import { RoleActorType, RoleProtoType } from "~context/enums";

export class RoleAdapter implements Adapters.Contract<Entities.Role, Adapters.Role.Types> {
    public buildWhereORM(
        filters: Adapters.Role.Filters,
        basic: ObjectQuery<Entities.Role> = {},
    ): ObjectQuery<Entities.Role> {
        const where: ObjectQuery<Entities.Role> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.actorType) {
            where.actorType = MikroAdapter.applyStringFilter<RoleActorType>(filters.actorType);
        }
        if (filters.protoType) {
            where.protoType = MikroAdapter.applyStringFilter<RoleProtoType>(filters.protoType);
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

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Role.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.Role, P, F> = {},
    ): FindOptions<Entities.Role, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Role>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }

    public buildWhereKnex(query: Knex.QueryBuilder, filters: Adapters.Role.Filters, tableAlias: string): void {
        if (filters.actorType) {
            KnexAdapter.applyStringFilter(query, filters.actorType, `${tableAlias}.actor_type`);
        }
        if (filters.protoType) {
            KnexAdapter.applyStringFilter(query, filters.protoType, `${tableAlias}.proto_type`);
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
        query: Knex.QueryBuilder,
        sort: Adapters.Role.Sort,
        pagination: Pagination,
        tableAlias: string,
    ): void {
        KnexAdapter.orderBy(query, sort, tableAlias, ["created_at", QueryOrder.ASC]);
        KnexAdapter.pagination(query, pagination);
    }
}
