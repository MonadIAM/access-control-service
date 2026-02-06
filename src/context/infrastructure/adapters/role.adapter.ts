import { FindOptions, Knex, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter, KnexAdapter } from "~infrastructure/database/utils";
import { RoleActorType, RoleProtoType } from "~context/enums";
import { Role } from "~context/domain/entities";

export class RoleAdapter {
    protected buildWhereORM(filters: Repositories.Role.Filters, basic: ObjectQuery<Role> = {}): ObjectQuery<Role> {
        const where: ObjectQuery<Role> = basic;

        if (filters.permission) {
            where.permissionMatrix = { permission: MikroAdapter.applyStringFilter(filters.permission) };
        }

        if (filters.actorType) {
            where.actorType = MikroAdapter.applyStringFilter<RoleActorType>(filters.actorType);
        }
        if (filters.protoType) {
            where.protoType = MikroAdapter.applyStringFilter<RoleProtoType>(filters.protoType);
        }
        if (filters.code) {
            where.code = MikroAdapter.applyStringFilter(filters.code);
        }
        if (filters.name) {
            where.name = MikroAdapter.applyStringFilter(filters.name);
        }
        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.nonDelegable !== undefined) {
            where.nonDelegable = { $eq: filters.nonDelegable };
        }
        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Role.Sort,
        pagination: Pagination,
        basic: FindOptions<Role, P, F> = {},
    ): FindOptions<Role, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Role>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }

    protected buildWhereKnex(query: Knex.QueryBuilder, filters: Repositories.Role.Filters, tableAlias: string): void {
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

    protected buildOptionsKnex(
        query: Knex.QueryBuilder,
        sort: Repositories.Role.Sort,
        pagination: Pagination,
        tableAlias: string,
    ): void {
        KnexAdapter.orderBy(query, sort, tableAlias, ["created_at", QueryOrder.ASC]);
        KnexAdapter.pagination(query, pagination);
    }
}
