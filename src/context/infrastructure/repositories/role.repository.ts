import { QueryOrder, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { MikroAdapter, knex } from "~infrastructure/database";
import { RoleClosure, Role } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { RoleAdapter } from "../adapters";

@Injectable({ scope: Scope.DEFAULT })
export class RoleRepository
    extends BaseRepository<Entities.Role, Adapters.Role.Types>({
        Adapter: RoleAdapter,
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
            throw ExceptionMapper.fromORM(error, this.constructor.name);
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
                        ...MikroAdapter.pagination(pagination),
                    },
                )
                .then(([relations, total]) => [
                    relations.map(({ ancestor, depth }) => Object.assign(ancestor, { depth })),
                    total,
                ]);
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
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
            throw ExceptionMapper.fromORM(error, this.constructor.name);
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
                        ...MikroAdapter.pagination(pagination),
                    },
                )
                .then(([relations, total]) => [
                    relations.map(({ descendant, depth }) => Object.assign(descendant, { depth })),
                    total,
                ]);
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
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
                builder.andWhere("r.name % ?", [term]).orderBy({
                    [raw("similarity(r.name, ?)", [term])]: "DESC",
                });
            } else {
                builder.orderBy({ "r.name": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async findDelegable(props: Repositories.Role.FindDelegable.Props): Repositories.Role.FindDelegable.Result {
        try {
            const { where, pagination, filters, sort } = props;
            const entityManager = this.readManager.fork();

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const allowedIdsSubquery = knex("access_control.role_delegation_policy as policy")
                .join("access_control.role_closure as closure", (join) => {
                    join.on("policy.target_id", "=", "closure.ancestor_id");
                    join.andOn("closure.depth", "<=", "policy.depth_limit");
                })
                .where("policy.is_revoked", false)
                .modify((builder) => {
                    builder.andWhere((sub) => {
                        if (where.type === "ACCOUNT") {
                            const rolesByAccountSubquery = knex("access_control.account_role_assignment")
                                .select("role_id")
                                .where("account", where.id);
                            sub.whereIn("policy.delegator_id", rolesByAccountSubquery);
                        } else {
                            sub.where("policy.delegator_id", where.id);
                        }
                    });
                })
                .select("closure.descendant_id");

            const baseQuery = (): ORM.QueryBuilder =>
                knex
                    .from({ R: "access_control.role" })
                    .modify((qb) => {
                        if (where.realm) {
                            qb.where("R.realm_id", where.realm);
                        }
                    })
                    .whereIn("R.id", allowedIdsSubquery);

            const dataQuery = baseQuery().distinct("R.id").select("R.*");
            super.buildWhereKnex?.(dataQuery, filters, "R");
            super.buildOptionsKnex?.(dataQuery, sort, pagination, "R");

            const countQuery = baseQuery().countDistinct("R.id as total");
            super.buildWhereKnex?.(countQuery, filters, "R");

            const dataSQL = dataQuery.toSQL();
            const countSQL = countQuery.toSQL();

            const [rawRows, countRow] = await Promise.all([
                entityManager.execute<Repositories.Role.Row[]>(dataSQL.sql, [...dataSQL.bindings], "all"),
                entityManager.execute<Repositories.Role.CountRow>(countSQL.sql, [...countSQL.bindings], "get"),
            ]);

            const total = Number(countRow?.total ?? 0);
            const mappedRoles = rawRows.map((roleData) => entityManager.map(Role, roleData));

            return [mappedRoles, total];
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async findEffective(props: Repositories.Role.FindEffective.Props): Repositories.Role.FindEffective.Result {
        try {
            const { where, pagination, filters, sort } = props;
            const entityManager = this.readManager.fork();

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const baseQuery = (): ORM.QueryBuilder =>
                knex
                    .from({ R: "access_control.role" })
                    .join({ RC: "access_control.role_closure" }, "R.id", "RC.ancestor_id")
                    .join({ ARM: "access_control.account_role_assignment" }, "RC.descendant_id", "ARM.role_id")
                    .where("ARM.account", where.account)
                    .modify((qb) => {
                        if (where.realm) {
                            qb.andWhere("ARM.realm_id", where.realm);
                        }
                    })
                    .andWhere("ARM.is_revoked", false);

            const dataQuery = baseQuery().distinct("R.id").select("R.*");
            super.buildWhereKnex!(dataQuery, filters, "R");
            super.buildOptionsKnex!(dataQuery, sort, pagination, "R");

            const countQuery = baseQuery().countDistinct("R.id as total");
            super.buildWhereKnex!(countQuery, filters, "R");

            const dataSQL = dataQuery.toSQL();
            const countSQL = countQuery.toSQL();

            const [rawRows, countRow] = await Promise.all([
                entityManager.execute<Repositories.Role.Row[]>(dataSQL.sql, [...dataSQL.bindings], "all"),
                entityManager.execute<Repositories.Role.CountRow>(countSQL.sql, [...countSQL.bindings], "get"),
            ]);

            const total = Number(countRow?.total ?? 0);
            const roles = rawRows.map((roleData) => entityManager.map(Role, roleData));

            return [roles, total];
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async getHierarchyGraph(
        props: Repositories.Role.GetHierarchyGraph.Props,
    ): Repositories.Role.GetHierarchyGraph.Result {
        try {
            const { transaction, realm } = props;
            const entityManager = transaction ?? this.readManager;

            const nodesCTE = knex("access_control.role as role")
                .select(
                    "role.id",
                    "role.name as label",
                    knex.raw(
                        "jsonb_build_object('code', role.code, 'archetype', role.archetype, 'isRevoked', role.is_revoked) AS attributes",
                    ),
                )
                .where("role.realm_id", realm);

            const edgesCTE = knex("access_control.role_closure as closure")
                .select(
                    knex.raw("'edge_' || closure.ancestor_id || '_' || closure.descendant_id AS id"),
                    "closure.ancestor_id as source",
                    "closure.descendant_id as target",
                    knex.raw("'arrow' AS type"),
                )
                .where("closure.realm_id", realm)
                .andWhere("closure.depth", 1);

            // NOTE[SQL-05]: see NOTES.md#SQL-05
            const query = knex
                .with("formatted_nodes", nodesCTE)
                .with("formatted_edges", edgesCTE)
                .select({
                    nodes: knex.raw("COALESCE((SELECT json_agg(formatted_nodes) FROM formatted_nodes), '[]'::json)"),
                    edges: knex.raw("COALESCE((SELECT json_agg(formatted_edges) FROM formatted_edges), '[]'::json)"),
                })
                .toSQL();

            const result = await entityManager.execute<Repositories.Role.Graph.Data>(query.sql, [...query.bindings], "get");

            return {
                nodes: result?.nodes ?? [],
                edges: result?.edges ?? [],
            };
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async findAccountsByRoles(
        props: Repositories.Role.FindAccountsByRoles.Props,
    ): Repositories.Role.FindAccountsByRoles.Result {
        const { transaction, roles } = props;
        const entityManager = transaction ?? this.readManager.fork();

        // NOTE[SQL-02]: see NOTES.md#SQL-02
        const query = knex
            .select("ara.account")
            .distinct()
            .from({ rc: "access_control.role_closure" })
            .join({ ara: "access_control.account_role_assignment" }, "ara.role_id", "rc.descendant_id")
            .whereIn("rc.ancestor_id", roles)
            .andWhere("ara.is_revoked", false)
            .toSQL();

        const rows = await entityManager.execute<Repositories.Role.AccountRow[]>(query.sql, [...query.bindings], "all");

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
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
