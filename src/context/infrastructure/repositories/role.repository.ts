import { EntityManager, FilterQuery, Loaded, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RepositoryException } from "~common/exceptions";
import { Role } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleRepository {
    private readonly resource = "Role";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {}

    public async create({ transaction, entity }: Repositories.Role.Create): Promise<Role> {
        try {
            const entityManager = transaction ?? this.writeManager;

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.Role.Update): Promise<Role> {
        try {
            const entityManager = transaction ?? this.writeManager;

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, realm, id }: Repositories.Role.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager;
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
            const entityManager = transaction ?? this.writeManager;

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
            const entityManager = transaction ?? this.writeManager;
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

    public findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Role.FindUnique<P, F>): Promise<Nullable<Loaded<Role, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOne(Role, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Role.FindUniqueOrThrow<P, F>): Promise<Loaded<Role, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOneOrFail(Role, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findMany<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Role.FindMany<P, F>): Promise<[Loaded<Role, P, F>[], number]> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findAndCount(Role, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findDelegateableRoles<P extends string = never, F extends string = "*">({
        transaction,
        options,
        account,
        roles,
        where,
    }: Repositories.Role.FindDelegateableRoles<P, F>): Promise<[Loaded<Role, P, F>[], number]> {
        try {
            const entityManager = transaction ?? this.readManager;
            const knex = entityManager.getKnex();

            const allowedIdsSubquery = knex("access_control.role_delegation_policy as policy")
                .join("access_control.role_closure as closure", (join) => {
                    join.on("policy.target_role_id", "=", "closure.ancestor_id");
                    join.andOn((sub) => {
                        sub.onVal("policy.is_absolute", "=", true).orOnVal("closure.depth", "=", 0);
                    });
                })
                .where("policy.is_revoked", false)
                .select("closure.descendant_id");

            if (account) {
                const rolesByAccountSubquery = knex("access_control.account_roles")
                    .select("role_id")
                    .where("account_id", account);
                allowedIdsSubquery.whereIn("policy.delegator_role_id", rolesByAccountSubquery);
            }

            if (roles?.length) {
                allowedIdsSubquery.whereIn("policy.delegator_role_id", roles);
            }

            return entityManager.findAndCount(Role, Object.assign({}, where, { id: { $in: allowedIdsSubquery } }), options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findEffectiveRoles({
        transaction,
        account,
        offset,
        limit,
        realm,
    }: Repositories.Role.FindEffectiveRoles): Promise<[Role[], number]> {
        try {
            const entityManager = transaction ?? this.readManager;
            const knex = entityManager.getKnex();

            const query = knex
                .select(["R.*", knex.raw("count(*) OVER() as total")])
                .distinct("R.id")
                .from({ R: "access_control.role" })
                .join({ RC: "access_control.role_closure" }, "R.id", "RC.ancestor_id")
                .join({ ARM: "access_control.account_role_matrix" }, "RC.descendant_id", "ARM.role_id")
                .where("ARM.account_id", account)
                .andWhere("ARM.realm", realm)
                .andWhere("ARM.is_revoked", false)
                .orderBy("R.id", "asc");

            if (limit !== undefined) {
                query.limit(limit);
            }
            if (offset !== undefined) {
                query.offset(offset);
            }

            const rawRows = await query;

            if (rawRows.length) {
                const total = Number(rawRows[0].total);
                const roles = rawRows.map(({ total: _, ...roleData }) => {
                    return entityManager.map(Role, roleData);
                });
                return [roles, total];
            } else {
                return [[], 0];
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    // TODO: возможно стоит вынести маппинги на уровень сервиса.
    public async getRoleGraph({ transaction, realm }: Repositories.Role.GetRoleGraph): Promise<RoleGraph.Data> {
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
                .first<RoleGraph.Data>();

            return {
                nodes: result?.nodes ?? [],
                edges: result?.edges ?? [],
            };
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
