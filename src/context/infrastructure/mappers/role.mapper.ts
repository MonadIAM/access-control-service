import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter, QueryBuilderAdapter } from "~infrastructure/database/utils";
import { RoleActorType, RoleArchetype } from "~context/enums";

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
        if (filters.nonDelegable !== undefined) {
            where.nonDelegable = { $eq: filters.nonDelegable };
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

    public buildWhereKnex(query: ORM.QueryBuilder, filters: Repositories.Mappers.Role.Filters, tableAlias: string): void {
        if (filters.realm) {
            QueryBuilderAdapter.applyStringFilter(query, filters.realm, `${tableAlias}.realm_id`);
        }
        if (filters.actorType) {
            QueryBuilderAdapter.applyStringFilter(query, filters.actorType, `${tableAlias}.actor_type`);
        }
        if (filters.archetype) {
            QueryBuilderAdapter.applyStringFilter(query, filters.archetype, `${tableAlias}.archetype`);
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

        if (filters.updatedAt) {
            QueryBuilderAdapter.applyOrdinalFilter(query, filters.updatedAt, `${tableAlias}.updated_at`);
        }
        if (filters.createdAt) {
            QueryBuilderAdapter.applyOrdinalFilter(query, filters.createdAt, `${tableAlias}.created_at`);
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
        sort: Repositories.Mappers.Role.Sort,
        pagination: Pagination,
        tableAlias: string,
    ): void {
        QueryBuilderAdapter.orderBy(query, sort, tableAlias, ["created_at", QueryOrder.ASC]);
        QueryBuilderAdapter.pagination(query, pagination);
    }
}
