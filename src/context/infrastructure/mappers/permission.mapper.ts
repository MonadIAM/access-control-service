import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter, QueryBuilderAdapter, kysely } from "~infrastructure/database/utils";

const { ref } = kysely.dynamic;

export class PermissionMapper implements Repositories.Mappers.Contract<
    Entities.Permission,
    Repositories.Mappers.Permission.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.Permission.Filters,
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
        sort: Repositories.Mappers.Permission.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Permission, P, F> = {},
    ): ORM.FindOptions<Entities.Permission, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Permission>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }

    public buildWhereKysely<DB, Table extends keyof DB, Output>(
        query: ORM.QueryBuilder<DB, Table, Output>,
        filters: Repositories.Mappers.Permission.Filters,
        tableAlias: string,
    ): ORM.QueryBuilder<DB, Table, Output> {
        let filtered = query;

        if (filters.realm) {
            filtered = QueryBuilderAdapter.applyStringFilter(filtered, filters.realm, `${tableAlias}.realm_id`);
        }
        if (filters.code) {
            filtered = QueryBuilderAdapter.applyStringFilter(filtered, filters.code, `${tableAlias}.code`);
        }
        if (filters.name) {
            filtered = QueryBuilderAdapter.applyStringFilter(filtered, filters.name, `${tableAlias}.name`);
        }
        if (filters.id) {
            filtered = QueryBuilderAdapter.applyStringFilter(filtered, filters.id, `${tableAlias}.id`);
        }

        if (filters.createdAt) {
            filtered = QueryBuilderAdapter.applyOrdinalFilter(filtered, filters.createdAt, `${tableAlias}.created_at`);
        }

        if (filters.isSystemManaged !== undefined) {
            filtered = filtered.where(ref(`${tableAlias}.is_system_managed`), "=", filters.isSystemManaged);
        }
        if (filters.isRevoked !== undefined) {
            filtered = filtered.where(ref(`${tableAlias}.is_revoked`), "=", filters.isRevoked);
        }

        return filtered;
    }

    public buildOptionsKysely<DB, Table extends keyof DB, Output>(
        query: ORM.QueryBuilder<DB, Table, Output>,
        sort: Repositories.Mappers.Permission.Sort,
        pagination: Pagination,
        tableAlias: string,
    ): ORM.QueryBuilder<DB, Table, Output> {
        const ordered = QueryBuilderAdapter.orderBy(query, sort, tableAlias, ["created_at", QueryOrder.ASC]);

        return QueryBuilderAdapter.pagination(ordered, pagination);
    }
}
