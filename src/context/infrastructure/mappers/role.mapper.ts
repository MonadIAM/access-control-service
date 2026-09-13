import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter, QueryBuilderAdapter, kysely } from "~infrastructure/database/utils";
import { RoleActorType, RoleArchetype } from "~context/enums";

const { ref } = kysely.dynamic;

export class RoleMapper implements Repositories.Mappers.Contract<Entities.Role, Repositories.Mappers.Role.Types> {
    public buildWhereORM(
        filters: Repositories.Mappers.Role.Filters,
        basic: ORM.ObjectQuery<Entities.Role> = {},
    ): ORM.ObjectQuery<Entities.Role> {
        const where: ORM.ObjectQuery<Entities.Role> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.actorType) {
            where.actorType = ORMAdapter.applyStringFilter<RoleActorType>(filters.actorType);
        }
        if (filters.archetype) {
            where.archetype = ORMAdapter.applyStringFilter<RoleArchetype>(filters.archetype);
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
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.isRevoked !== undefined) {
            where.isRevoked = { $eq: filters.isRevoked };
        }
        if (filters.permission) {
            where.permissionAssignments = { permission: ORMAdapter.applyStringFilter(filters.permission) };
        }
        if (filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.Role.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Role, P, F> = {},
    ): ORM.FindOptions<Entities.Role, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Role>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }

    public buildWhereKysely<DB, Table extends keyof DB, Output>(
        query: ORM.QueryBuilder<DB, Table, Output>,
        filters: Repositories.Mappers.Role.Filters,
        tableAlias: string,
    ): ORM.QueryBuilder<DB, Table, Output> {
        let filtered = query;

        if (filters.realm) {
            filtered = QueryBuilderAdapter.applyStringFilter(filtered, filters.realm, `${tableAlias}.realm_id`);
        }
        if (filters.actorType) {
            filtered = QueryBuilderAdapter.applyStringFilter(filtered, filters.actorType, `${tableAlias}.actor_type`);
        }
        if (filters.archetype) {
            filtered = QueryBuilderAdapter.applyStringFilter(filtered, filters.archetype, `${tableAlias}.archetype`);
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

        if (filters.updatedAt) {
            filtered = QueryBuilderAdapter.applyOrdinalFilter(filtered, filters.updatedAt, `${tableAlias}.updated_at`);
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
        sort: Repositories.Mappers.Role.Sort,
        pagination: Pagination,
        tableAlias: string,
    ): ORM.QueryBuilder<DB, Table, Output> {
        const ordered = QueryBuilderAdapter.orderBy(query, sort, tableAlias, ["created_at", QueryOrder.ASC]);

        return QueryBuilderAdapter.pagination(ordered, pagination);
    }
}
