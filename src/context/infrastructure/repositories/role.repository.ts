import { QueryOrder, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { sql } from "kysely";

import { ORMAdapter, kysely } from "~infrastructure/database";
import { RoleClosure, Role } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { RoleMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RoleRepository
    extends BaseRepository<Entities.Role, Repositories.Mappers.Role.Types, typeof RoleMapper>({
        Mapper: RoleMapper,
        Entity: Role,
    })
    implements Repositories.Role.Contract
{
    protected readonly roleLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.roleLimit = this.configService.getOrThrow<number>("ROLE_PER_REALM_LIMIT");
    }

    public async getAncestors(props: Repositories.Role.GetAncestors.Props): Repositories.Role.GetAncestors.Result {
        try {
            const where: ORM.FilterQuery<Entities.RoleClosure> = {
                ...(props.depth ? { depth: props.depth } : {}),
                descendant: props.descendant,
                ancestor: props.where ?? {},
            };
            return await props.transaction
                .find(RoleClosure, where, {
                    ...props.options,
                    populate: ["ancestor"],
                    orderBy: { depth: QueryOrder.DESC },
                })
                .then((relations) => relations.map(({ ancestor }) => ancestor));
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findAncestors(props: Repositories.Role.FindAncestors.Props): Repositories.Role.FindAncestors.Result {
        try {
            const { populate, pagination, filters, descendant } = props;
            const ancestorPopulate = populate.map((key) => `ancestor.${key}` as const);
            const where = super.buildWhereORM(filters, { realm: props.realm });
            const entityManager = this.readManager.fork();
            return await entityManager
                .findAndCount(
                    RoleClosure,
                    { descendant, ancestor: where },
                    {
                        populate: ["ancestor", ...ancestorPopulate],
                        orderBy: { depth: QueryOrder.DESC },
                        ...ORMAdapter.pagination(pagination),
                    },
                )
                .then(([relations, total]) => [
                    relations.map(({ ancestor, depth }) => Object.assign(ancestor, { depth })),
                    total,
                ]);
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async getDescendants(props: Repositories.Role.GetDescendants.Props): Repositories.Role.GetDescendants.Result {
        try {
            const where: ORM.FilterQuery<Entities.RoleClosure> = {
                ...(props.depth ? { depth: props.depth } : {}),
                descendant: props.where ?? {},
                ancestor: props.ancestor,
            };
            return await props.transaction
                .find(RoleClosure, where, {
                    ...props.options,
                    populate: ["descendant"],
                    orderBy: { depth: QueryOrder.DESC },
                })
                .then((relations) => {
                    return relations.map(({ descendant }) => descendant);
                });
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findDescendants(props: Repositories.Role.FindDescendants.Props): Repositories.Role.FindDescendants.Result {
        try {
            const { populate, pagination, filters, ancestor } = props;
            const descendantPopulate = populate.map((key) => `descendant.${key}` as const);
            const where = super.buildWhereORM(filters, { realm: props.realm });
            const entityManager = this.readManager.fork();
            return await entityManager
                .findAndCount(
                    RoleClosure,
                    { ancestor, descendant: where },
                    {
                        populate: ["descendant", ...descendantPopulate],
                        orderBy: { depth: QueryOrder.DESC },
                        ...ORMAdapter.pagination(pagination),
                    },
                )
                .then(([relations, total]) => [
                    relations.map(({ descendant, depth }) => Object.assign(descendant, { depth })),
                    total,
                ]);
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async getLookupList(props: Repositories.Role.GetLookupList.Props): Repositories.Role.GetLookupList.Result {
        try {
            const { pagination, realm, term } = props;
            const entityManager = this.readManager.fork();
            const builder = entityManager.createQueryBuilder(Role, "r");

            builder
                .select(["r.id", "r.code", "r.name"])
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            if (realm) {
                builder.where({ "r.realm": realm });
            }

            if (term) {
                builder
                    .andWhere("r.name % ?", [term])
                    .orderBy([{ [raw("similarity(r.name, ?)", [term])]: "DESC" }, { "r.name": "ASC" }, { "r.id": "ASC" }]);
            } else {
                builder.orderBy({ "r.name": "ASC", "r.id": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findDelegable(props: Repositories.Role.FindDelegable.Props): Repositories.Role.FindDelegable.Result {
        try {
            const { where, pagination, filters, sort } = props;
            const entityManager = this.readManager.fork();

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const allowedIdsSubquery = kysely
                .selectFrom("access_control.role_delegation_policy as policy")
                .innerJoin("access_control.role_closure as closure", (join) =>
                    join
                        .onRef("policy.target_id", "=", "closure.ancestor_id")
                        .onRef("closure.depth", "<=", "policy.depth_limit"),
                )
                .select("closure.descendant_id")
                .where("policy.is_revoked", "=", false)
                .where(sql<boolean>`(policy.expires_at is null or policy.expires_at > now())`)
                .whereRef("closure.realm_id", "=", "policy.realm_id")
                .$call((query) =>
                    where.realm
                        ? query.where("policy.realm_id", "=", where.realm).where("closure.realm_id", "=", where.realm)
                        : query,
                )
                .where((eb) =>
                    where.type === "ACCOUNT"
                        ? eb.exists(
                              eb
                                  .selectFrom("access_control.account_role_assignment as assignment")
                                  .select(sql`1`.as("matched"))
                                  .where("assignment.account", "=", where.id)
                                  .where("assignment.is_revoked", "=", false)
                                  .where(sql<boolean>`(assignment.expires_at is null or assignment.expires_at > now())`)
                                  .whereRef("assignment.role_id", "=", "policy.delegator_id")
                                  .whereRef("assignment.realm_id", "=", "policy.realm_id")
                                  .$call((query) =>
                                      where.realm ? query.where("assignment.realm_id", "=", where.realm) : query,
                                  ),
                          )
                        : eb("policy.delegator_id", "=", where.id),
                );

            const baseQuery = kysely
                .selectFrom("access_control.role as R")
                .$call((query) => (where.realm ? query.where("R.realm_id", "=", where.realm) : query))
                .where("R.id", "in", allowedIdsSubquery);

            const dataQuery = baseQuery
                .distinct()
                .select("R.id")
                .selectAll("R")
                .$call((query) => super.buildWhereKysely(query, filters, "R"))
                .$call((query) => super.buildOptionsKysely(query, sort, pagination, "R"))
                .compile();

            const countQuery = baseQuery
                .select((eb) => eb.fn.count("R.id").distinct().as("total"))
                .$call((query) => super.buildWhereKysely(query, filters, "R"))
                .compile();

            const [rawRows, countRow] = await Promise.all([
                entityManager.execute<Repositories.Role.Row[]>(dataQuery.sql, [...dataQuery.parameters], "all"),
                entityManager.execute<Repositories.Role.CountRow>(countQuery.sql, [...countQuery.parameters], "get"),
            ]);

            const total = Number(countRow?.total ?? 0);
            const mappedRoles = rawRows.map((roleData) => entityManager.map(Role, roleData));

            return [mappedRoles, total];
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findEffective(props: Repositories.Role.FindEffective.Props): Repositories.Role.FindEffective.Result {
        try {
            const { where, pagination, filters, sort } = props;
            const entityManager = this.readManager.fork();

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const baseQuery = kysely
                .selectFrom("access_control.role as R")
                .innerJoin("access_control.role_closure as RC", "R.id", "RC.ancestor_id")
                .innerJoin("access_control.account_role_assignment as ARM", "RC.descendant_id", "ARM.role_id")
                .where("ARM.account", "=", where.account)
                .whereRef("RC.realm_id", "=", "ARM.realm_id")
                .whereRef("R.realm_id", "=", "ARM.realm_id")
                .$call((query) => (where.realm ? query.where("ARM.realm_id", "=", where.realm) : query))
                .where("ARM.is_revoked", "=", false)
                .where(sql<boolean>`("ARM"."expires_at" is null or "ARM"."expires_at" > now())`);

            const dataQuery = baseQuery
                .distinct()
                .select("R.id")
                .selectAll("R")
                .$call((query) => super.buildWhereKysely(query, filters, "R"))
                .$call((query) => super.buildOptionsKysely(query, sort, pagination, "R"))
                .compile();

            const countQuery = baseQuery
                .select((eb) => eb.fn.count("R.id").distinct().as("total"))
                .$call((query) => super.buildWhereKysely(query, filters, "R"))
                .compile();

            const [rawRows, countRow] = await Promise.all([
                entityManager.execute<Repositories.Role.Row[]>(dataQuery.sql, [...dataQuery.parameters], "all"),
                entityManager.execute<Repositories.Role.CountRow>(countQuery.sql, [...countQuery.parameters], "get"),
            ]);

            const total = Number(countRow?.total ?? 0);
            const roles = rawRows.map((roleData) => entityManager.map(Role, roleData));

            return [roles, total];
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async getHierarchyGraph(
        props: Repositories.Role.GetHierarchyGraph.Props,
    ): Repositories.Role.GetHierarchyGraph.Result {
        try {
            const { transaction, realm } = props;
            const entityManager = transaction ?? this.readManager;

            const nodesCTE = kysely
                .selectFrom("access_control.role as role")
                .select([
                    "role.id",
                    "role.name as label",
                    sql`jsonb_build_object('code', role.code, 'archetype', role.archetype, 'isRevoked', role.is_revoked)`.as(
                        "attributes",
                    ),
                ])
                .where("role.realm_id", "=", realm);

            const edgesCTE = kysely
                .selectFrom("access_control.role_closure as closure")
                .select([
                    sql`'edge_' || closure.ancestor_id || '_' || closure.descendant_id`.as("id"),
                    "closure.ancestor_id as source",
                    "closure.descendant_id as target",
                    sql`'arrow'`.as("type"),
                ])
                .where("closure.realm_id", "=", realm)
                .where("closure.depth", "=", 1);

            // NOTE[SQL-05]: see NOTES.md#SQL-05
            const query = kysely
                .with("formatted_nodes", () => nodesCTE)
                .with("formatted_edges", () => edgesCTE)
                .selectNoFrom([
                    sql`COALESCE((SELECT json_agg(formatted_nodes) FROM formatted_nodes), '[]'::json)`.as("nodes"),
                    sql`COALESCE((SELECT json_agg(formatted_edges) FROM formatted_edges), '[]'::json)`.as("edges"),
                ])
                .compile();

            const result = await entityManager.execute<Repositories.Role.Graph.Data>(
                query.sql,
                [...query.parameters],
                "get",
            );

            return {
                nodes: result?.nodes ?? [],
                edges: result?.edges ?? [],
            };
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findAccountsByRoles(
        props: Repositories.Role.FindAccountsByRoles.Props,
    ): Repositories.Role.FindAccountsByRoles.Result {
        const { transaction, roles } = props;
        const entityManager = transaction ?? this.readManager.fork();

        // NOTE[SQL-02]: see NOTES.md#SQL-02
        const query = kysely
            .selectFrom("access_control.role_closure as rc")
            .innerJoin("access_control.role as role", "role.id", "rc.ancestor_id")
            .innerJoin("access_control.account_role_assignment as ara", "ara.role_id", "rc.descendant_id")
            .select("ara.account")
            .distinct()
            .where("rc.ancestor_id", "in", roles)
            .where("ara.is_revoked", "=", false)
            .where(sql<boolean>`(ara.expires_at is null or ara.expires_at > now())`)
            .whereRef("ara.realm_id", "=", "rc.realm_id")
            .whereRef("role.realm_id", "=", "rc.realm_id")
            .compile();

        const rows = await entityManager.execute<Repositories.Role.AccountRow[]>(query.sql, [...query.parameters], "all");

        return rows.map(({ account }) => account);
    }

    public async wouldExceedRoleLimit(
        props: Repositories.Role.WouldExceedRoleLimit.Props,
    ): Repositories.Role.WouldExceedRoleLimit.Result {
        try {
            const { transaction, realm, count } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const total = await entityManager.count(Role, { realm });

            return total + (count ?? 1) > this.roleLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
