import { EntityDictionary, EntityManager, FilterQuery, Knex, Loaded, QueryOrder, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleAdapter } from "~context/infrastructure/adapters";
import { Role, RoleClosure } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";
import { MikroAdapter } from "~infrastructure/database";

@Injectable({ scope: Scope.DEFAULT })
export class RoleRepository extends RoleAdapter implements Repositories.Role.Contract {
    private readonly resource = "Role";

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Role.FindUnique<P, F>): Promise<Nullable<Loaded<Role, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(Role, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Role.FindUniqueOrThrow<P, F>): Promise<Loaded<Role, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(Role, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.Role.Find<P, F>,
    ): Promise<Loaded<Role, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(Role, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.Role.FindMany<P, F>,
    ): Promise<[Loaded<Role, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(Role, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(Role, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getAncestors(props: Repositories.Role.GetAncestors): Promise<Role[]> {
        try {
            const where: FilterQuery<RoleClosure> = {
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
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findAncestors(props: Repositories.Role.FindAncestors): Promise<[Repositories.Role.DepthEntity[], number]> {
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
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getDescendants(props: Repositories.Role.GetDescendants): Promise<Role[]> {
        try {
            const where: FilterQuery<RoleClosure> = {
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
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findDescendants(
        props: Repositories.Role.FindDescendants,
    ): Promise<[Repositories.Role.DepthEntity[], number]> {
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
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getLookupList({ pagination, realm, term }: Repositories.Role.GetLookupList): Promise<[Role[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const builder = entityManager.createQueryBuilder(Role, "r");

            builder
                .select(["r.id", "r.code", "r.name"])
                .where({ "r.realm": realm })
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            if (term) {
                builder.andWhere("r.name % ?", [term]).orderBy({
                    [raw("similarity(r.name, ?)", [term])]: "DESC",
                });
            } else {
                builder.orderBy({ "r.name": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findDelegateableRoles({
        where: { realm, type, id },
        pagination,
        filters,
        sort,
    }: Repositories.Role.FindDelegateableRoles): Promise<[Role[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const allowedIdsSubquery = knex("access_control.role_delegation_policy as policy")
                .join("access_control.role_closure as closure", (join) => {
                    join.on("policy.target_id", "=", "closure.ancestor_id");
                    join.andOn("closure.depth", "<=", "policy.depth_limit");
                })
                .where("policy.is_revoked", false)
                .modify((builder) => {
                    builder.andWhere((sub) => {
                        if (type === "ACCOUNT") {
                            const rolesByAccountSubquery = knex("access_control.account_role_assignment")
                                .select("role_id")
                                .where("account_id", id);
                            sub.whereIn("policy.delegator_id", rolesByAccountSubquery);
                        } else {
                            sub.where("policy.delegator_id", id);
                        }
                    });
                })
                .select("closure.descendant_id");

            const baseQuery = (): Knex.QueryBuilder =>
                knex.from({ R: "access_control.role" }).where("R.realm_id", realm).whereIn("R.id", allowedIdsSubquery);

            const dataQuery = baseQuery().distinct("R.id").select("R.*");
            super.buildWhereKnex(dataQuery, filters, "R");
            super.buildOptionsKnex(dataQuery, sort, pagination, "R");

            const countQuery = baseQuery().countDistinct("R.id as total");
            super.buildWhereKnex(countQuery, filters, "R");

            const [rawRows, countResult] = await Promise.all([dataQuery, countQuery.first<{ total: string }>()]);

            const total = Number(countResult?.total ?? 0);
            const mappedRoles = rawRows.map((roleData: EntityDictionary<Role>) => entityManager.map(Role, roleData));

            return [mappedRoles, total];
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findEffectiveRoles({
        where: { account, realm },
        pagination,
        filters,
        sort,
    }: Repositories.Role.FindEffectiveRoles): Promise<[Role[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const baseQuery = (): Knex.QueryBuilder =>
                knex
                    .from({ R: "access_control.role" })
                    .join({ RC: "access_control.role_closure" }, "R.id", "RC.ancestor_id")
                    .join({ ARM: "access_control.account_role_assignment" }, "RC.descendant_id", "ARM.role_id")
                    .where("ARM.account_id", account)
                    .andWhere("ARM.realm_id", realm)
                    .andWhere("ARM.is_revoked", false);

            const dataQuery = baseQuery().distinct("R.id").select("R.*");
            super.buildWhereKnex(dataQuery, filters, "R");
            super.buildOptionsKnex(dataQuery, sort, pagination, "R");

            const countQuery = baseQuery().countDistinct("R.id as total");
            super.buildWhereKnex(countQuery, filters, "R");

            const [rawRows, countResult] = await Promise.all([dataQuery, countQuery.first<{ total: string }>()]);

            const total = Number(countResult?.total ?? 0);
            const roles = rawRows.map((roleData: EntityDictionary<Role>) => entityManager.map(Role, roleData));

            return [roles, total];
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getHierarchyGraph({
        transaction,
        realm,
    }: Repositories.Role.GetHierarchyGraph): Promise<Repositories.Role.Graph.Data> {
        try {
            const knex = (transaction ?? this.readManager).getKnex();

            const nodesCTE = knex("access_control.role as role")
                .select(
                    "role.id",
                    "role.name as label",
                    knex.raw(
                        "jsonb_build_object('code', role.code, 'protoType', role.proto_type, 'isRevoked', role.is_revoked) AS attributes",
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

            const result = await knex
                .with("formatted_nodes", nodesCTE)
                .with("formatted_edges", edgesCTE)
                .select({
                    nodes: knex.raw("COALESCE((SELECT json_agg(formatted_nodes) FROM formatted_nodes), '[]'::json)"),
                    edges: knex.raw("COALESCE((SELECT json_agg(formatted_edges) FROM formatted_edges), '[]'::json)"),
                })
                .first<Repositories.Role.Graph.Data>();

            return {
                nodes: result?.nodes ?? [],
                edges: result?.edges ?? [],
            };
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async wouldExceedRoleLimit({
        transaction,
        realm,
        count,
    }: Repositories.Role.WouldExceedRoleLimit): Promise<boolean> {
        try {
            const limit = this.configService.getOrThrow<number>("ROLE_PER_REALM_LIMIT");
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total }] = await knex("access_control.role").where("realm_id", realm).count("id as total");

            return Number(total) + count > limit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
