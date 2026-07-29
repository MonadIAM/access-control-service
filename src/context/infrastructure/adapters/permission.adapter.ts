import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter, QueryBuilderAdapter } from "~infrastructure/database/utils";

export class PermissionAdapter implements Adapters.Contract<Entities.Permission, Adapters.Permission.Types> {
    public buildWhereORM(
        filters: Adapters.Permission.Filters,
        basic: ORM.ObjectQuery<Entities.Permission> = {},
    ): ORM.ObjectQuery<Entities.Permission> {
        const where: ORM.ObjectQuery<Entities.Permission> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = { $eq: filters.isSystemManaged };
        }
        if (filters.code) {
            where.code = ORMAdapter.applyStringFilter(filters.code);
        }
        if (filters.name) {
            where.name = ORMAdapter.applyStringFilter(filters.name);
        }
        if (filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
        }
        if (filters.role) {
            where.roleAssignments = { role: ORMAdapter.applyStringFilter(filters.role) };
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Permission.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Permission, P, F> = {},
    ): ORM.FindOptions<Entities.Permission, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Permission>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }

    public buildWhereKnex(query: ORM.QueryBuilder, filters: Adapters.Permission.Filters, tableAlias: string): void {
        if (filters.realm) {
            QueryBuilderAdapter.applyStringFilter(query, filters.realm, `${tableAlias}.realm_id`);
        }
        if (filters.code) {
            QueryBuilderAdapter.applyStringFilter(query, filters.code, `${tableAlias}.code`);
        }
        if (filters.name) {
            QueryBuilderAdapter.applyStringFilter(query, filters.name, `${tableAlias}.name`);
        }
        if (filters.id) {
            QueryBuilderAdapter.applyStringFilter(query, filters.id, `${tableAlias}.id`);
        }

        if (filters.createdAt) {
            QueryBuilderAdapter.applyOrdinalFilter(query, filters.createdAt, `${tableAlias}.created_at`);
        }

        if (filters.isSystemManaged !== undefined) {
            query.where(`${tableAlias}.is_system_managed`, filters.isSystemManaged);
        }
        if (filters.isRevoked !== undefined) {
            query.where(`${tableAlias}.is_revoked`, filters.isRevoked);
        }
    }

    public buildOptionsKnex(
        query: ORM.QueryBuilder,
        sort: Adapters.Permission.Sort,
        pagination: Pagination,
        tableAlias: string,
    ): void {
        QueryBuilderAdapter.orderBy(query, sort, tableAlias, ["created_at", QueryOrder.ASC]);
        QueryBuilderAdapter.pagination(query, pagination);
    }
}
