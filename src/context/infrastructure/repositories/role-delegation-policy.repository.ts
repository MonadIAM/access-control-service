import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RoleDelegationPolicyAdapter } from "~context/infrastructure/adapters";
import { RoleDelegationPolicy } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyRepository
    extends RoleDelegationPolicyAdapter
    implements Repositories.RoleDelegationPolicy.Contract
{
    private readonly resource = "RoleDelegationPolicy";

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
    ) {
        super();
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleDelegationPolicy.FindUnique<P, F>): Promise<Nullable<Loaded<RoleDelegationPolicy, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(RoleDelegationPolicy, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleDelegationPolicy.FindUniqueOrThrow<P, F>): Promise<Loaded<RoleDelegationPolicy, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(RoleDelegationPolicy, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.RoleDelegationPolicy.FindMany<P, F>,
    ): Promise<[Loaded<RoleDelegationPolicy, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(RoleDelegationPolicy, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(RoleDelegationPolicy, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async existsTransitivePath({
        transaction,
        from,
        to,
    }: Repositories.RoleDelegationPolicy.ExistsTransitivePath): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();
            const targetIds = Array.isArray(to) ? to : [to];

            const query = knex
                .withRecursive("transitive_power", (cte) => {
                    cte.select("rc_target.descendant_id as reachable_role_id")
                        .from("access_control.role_delegation_policy as rdp")
                        .join(
                            "access_control.role_closure as rc_grantor",
                            "rdp.delegator_role_id",
                            "rc_grantor.ancestor_id",
                        )
                        .join("access_control.role_closure as rc_target", "rdp.target_role_id", "rc_target.ancestor_id")
                        .where("rc_grantor.descendant_id", from)
                        .andWhere("rdp.is_revoked", false)
                        .andWhere((builder) => {
                            builder.where("rdp.is_absolute", false).orWhere("rc_target.depth", 0);
                        })
                        .distinct();

                    cte.union((union) => {
                        union
                            .select("rc_target_next.descendant_id")
                            .from("access_control.role_delegation_policy as rdp_next")
                            .join(
                                "access_control.role_closure as rc_grantor_next",
                                "rdp_next.delegator_role_id",
                                "rc_grantor_next.ancestor_id",
                            )
                            .join("transitive_power as tp", "rc_grantor_next.descendant_id", "tp.reachable_role_id")
                            .join(
                                "access_control.role_closure as rc_target_next",
                                "rdp_next.target_role_id",
                                "rc_target_next.ancestor_id",
                            )
                            .where("rdp_next.is_revoked", false)
                            .andWhere((builder) => {
                                builder.where("rdp_next.is_absolute", true).orWhere("rc_target_next.depth", 0);
                            });
                    });
                })
                .select(knex.raw("1"))
                .from("transitive_power")
                .whereIn("reachable_role_id", targetIds)
                .limit(1);

            const { sql, bindings } = query.toSQL();

            const [result] = await entityManager.getConnection().execute(sql, [...bindings]);

            return Boolean(result);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async isDelegationAllowed({
        transaction,
        roles,
        realm,
        actor,
    }: Repositories.RoleDelegationPolicy.IsDelegationAllowed): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const actorRolesCte = knex
                .select("ara.role_id")
                .from("access_control.account_role_assignment as ara")
                .where("ara.realm_id", realm)
                .andWhere("ara.account_id", actor)
                .andWhere("ara.is_revoked", false);

            const allowedTargetsCte = knex
                .select("rc.descendant_id as role_id")
                .from("access_control.role_delegation_policy as rdp")
                .join("actor_roles as ar", "ar.role_id", "rdp.delegator_id")
                .join("access_control.role_closure as rc", "rc.ancestor_id", "rdp.target_id")
                .where("rdp.realm_id", realm)
                .andWhere("rdp.is_revoked", false)
                .andWhereRaw("rc.depth <= rdp.depth_limit");

            const query = knex
                .with("actor_roles", actorRolesCte)
                .with("allowed_targets", allowedTargetsCte)
                .select(knex.raw("count(*)::int = ? as result", [roles.length]))
                .from("allowed_targets as at")
                .whereIn("at.role_id", roles);

            const { sql, bindings } = query.toSQL();

            const [result] = await entityManager.getConnection().execute(sql, [...bindings]);
            return result?.result === true;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async isUpwardGrant({
        delegatorRole,
        transaction,
        targetRole,
    }: Repositories.RoleDelegationPolicy.IsUpwardGrant): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const query = knex("access_control.role_closure")
                .where("ancestor_id", targetRole)
                .whereIn("descendant_id", delegatorRole)
                .andWhere("depth", ">", 0)
                .select(knex.raw("1"))
                .limit(1);

            const { sql, bindings } = query.toSQL();

            const [result] = await entityManager.getConnection().execute(sql, [...bindings]);
            return Boolean(result);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
