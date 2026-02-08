import { EntityDictionary, EntityManager, FilterQuery, Knex, Loaded, raw, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RoleAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Role } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleRepository extends RoleAdapter implements Repositories.Role.Contract {
    private readonly resource = "Role";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {
        super();
    }

    public async create({ transaction, entity }: Repositories.Role.Create): Promise<Role> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.Role.Update): Promise<Role> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, realm, id }: Repositories.Role.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<Role> = {
                isSystemManaged: false,
                isRevoked: true,
                realm,
                id,
            };
            const affected = await entityManager.nativeDelete(Role, where);
            if (!affected) {
                throw RepositoryException.notFound({ resource: this.resource });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkUpdate({ transaction, updates }: Repositories.Role.BulkUpdate): Promise<Role[]> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            for (const { entity, patch } of updates) {
                wrap(entity).assign(patch, { merge: true });
            }

            await entityManager.flush();

            return updates.map(({ entity }) => entity);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkDelete({ transaction, identifiers, realm }: Repositories.Role.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<Role> = {
                id: { $in: identifiers },
                isSystemManaged: false,
                isRevoked: true,
                realm,
            };
            return await entityManager.nativeDelete(Role, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
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
                            const rolesByAccountSubquery = knex("access_control.account_role_matrix")
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
                    .join({ ARM: "access_control.account_role_matrix" }, "RC.descendant_id", "ARM.role_id")
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
}
