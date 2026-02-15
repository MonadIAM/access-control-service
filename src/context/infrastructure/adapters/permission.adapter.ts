import { FindOptions, Knex, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter, KnexAdapter } from "~infrastructure/database/utils";
import { Permission } from "~context/domain/entities";

export class PermissionAdapter {
    protected buildWhereORM(
        filters: Repositories.Permission.Filters,
        basic: ObjectQuery<Permission> = {},
    ): ObjectQuery<Permission> {
        const where: ObjectQuery<Permission> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.code) {
            where.code = MikroAdapter.applyStringFilter(filters.code);
        }
        if (filters.name) {
            where.name = MikroAdapter.applyStringFilter(filters.name);
        }
        if (filters.realm) {
            where.realm = MikroAdapter.applyStringFilter(filters.realm);
        }
        if (filters.role) {
            where.roleAssignments = { role: MikroAdapter.applyStringFilter(filters.role) };
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

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Permission.Sort,
        pagination: Pagination,
        basic: FindOptions<Permission, P, F> = {},
    ): FindOptions<Permission, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Permission>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }

    protected buildWhereKnex(query: Knex.QueryBuilder, filters: Repositories.Permission.Filters, tableAlias: string): void {
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
        if (filters.isRevoked !== undefined) {
            query.where(`${tableAlias}.is_revoked`, filters.isRevoked);
        }
    }

    protected buildOptionsKnex(
        query: Knex.QueryBuilder,
        sort: Repositories.Permission.Sort,
        pagination: Pagination,
        tableAlias: string,
    ): void {
        KnexAdapter.orderBy(query, sort, tableAlias, ["created_at", QueryOrder.ASC]);
        KnexAdapter.pagination(query, pagination);
    }
}
