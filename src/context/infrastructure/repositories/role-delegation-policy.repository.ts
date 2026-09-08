import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleDelegationPolicy } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { knex } from "~infrastructure/database";
import { BaseRepository } from "~common/mixins";

import { RoleDelegationPolicyMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyRepository
    extends BaseRepository<Entities.RoleDelegationPolicy, Repositories.Mappers.RoleDelegationPolicy.Types>({
        Mapper: RoleDelegationPolicyMapper,
        Entity: RoleDelegationPolicy,
    })
    implements Repositories.RoleDelegationPolicy.Contract
{
    protected readonly policyLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.policyLimit = this.configService.getOrThrow<number>("DELEGATION_POLICY_PER_ROLE_LIMIT");
    }

    public async existsTransitivePath(
        props: Repositories.RoleDelegationPolicy.ExistsTransitivePath.Props,
    ): Repositories.RoleDelegationPolicy.ExistsTransitivePath.Result {
        try {
            const { transaction, from, to } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const targetIds = Array.isArray(to) ? to : [to];

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const query = knex
                .withRecursive("transitive_power", (cte: ORM.QueryBuilder) => {
                    cte.select("rdp.realm_id", "rc.descendant_id as reachable_role_id")
                        .from("access_control.role_delegation_policy as rdp")
                        .join("access_control.role_closure as rc", "rc.ancestor_id", "rdp.target_id")
                        .whereRaw("rc.depth <= rdp.depth_limit")
                        .andWhereRaw("rc.realm_id = rdp.realm_id")
                        .andWhere("rdp.delegator_id", from)
                        .andWhere("rdp.is_revoked", false)
                        .andWhereRaw("(rdp.expires_at is null or rdp.expires_at > now())")
                        .distinct();

                    cte.union((union: ORM.QueryBuilder) => {
                        union
                            .select("rdp.realm_id", "rc.descendant_id as reachable_role_id")
                            .from("access_control.role_delegation_policy as rdp")
                            .join("transitive_power as tp", (join) => {
                                join.on("rdp.delegator_id", "=", "tp.reachable_role_id");
                                join.andOn("rdp.realm_id", "=", "tp.realm_id");
                            })
                            .join("access_control.role_closure as rc", "rc.ancestor_id", "rdp.target_id")
                            .whereRaw("rc.depth <= rdp.depth_limit")
                            .andWhereRaw("rc.realm_id = rdp.realm_id")
                            .andWhere("rdp.is_revoked", false)
                            .andWhereRaw("(rdp.expires_at is null or rdp.expires_at > now())")
                            .distinct();
                    });
                })
                .select(knex.raw("1 as exists_flag"))
                .from("transitive_power")
                .whereIn("reachable_role_id", targetIds)
                .limit(1)
                .toSQL();

            const [result] = await entityManager.execute<Repositories.RoleDelegationPolicy.ExistsRow[]>(
                query.sql,
                [...query.bindings],
                "all",
            );

            return Boolean(result);
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async isDelegationAllowed(
        props: Repositories.RoleDelegationPolicy.IsDelegationAllowed.Props,
    ): Repositories.RoleDelegationPolicy.IsDelegationAllowed.Result {
        try {
            const { transaction, roles, realm, actor } = props;
            const entityManager = transaction ?? this.readManager.fork();

            const actorRolesCte = knex
                .select("ara.role_id")
                .from("access_control.account_role_assignment as ara")
                .where("ara.realm_id", realm)
                .andWhere("ara.account", actor)
                .andWhere("ara.is_revoked", false)
                .andWhereRaw("(ara.expires_at is null or ara.expires_at > now())");

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const allowedTargetsCte = knex
                .select("rc.descendant_id as role_id")
                .from("access_control.role_delegation_policy as rdp")
                .join("actor_roles as ar", "ar.role_id", "rdp.delegator_id")
                .join("access_control.role_closure as rc", "rc.ancestor_id", "rdp.target_id")
                .where("rdp.realm_id", realm)
                .andWhere("rc.realm_id", realm)
                .andWhere("rdp.is_revoked", false)
                .andWhereRaw("(rdp.expires_at is null or rdp.expires_at > now())")
                .andWhereRaw("rc.depth <= rdp.depth_limit");

            const query = knex
                .with("actor_roles", actorRolesCte)
                .with("allowed_targets", allowedTargetsCte)
                .select(knex.raw("count(distinct at.role_id)::int = ? as result", [roles.length]))
                .from("allowed_targets as at")
                .whereIn("at.role_id", roles)
                .toSQL();

            const [result] = await entityManager.execute<Repositories.RoleDelegationPolicy.AllowedRow[]>(
                query.sql,
                [...query.bindings],
                "all",
            );

            return result?.result === true;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async wouldExceedPolicyLimit(
        props: Repositories.RoleDelegationPolicy.WouldExceedPolicyLimit.Props,
    ): Repositories.RoleDelegationPolicy.WouldExceedPolicyLimit.Result {
        try {
            const { transaction, delegator, count } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const total = await entityManager.count(RoleDelegationPolicy, {
                $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
                isRevoked: false,
                delegator,
            });

            return total + (count ?? 1) > this.policyLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
