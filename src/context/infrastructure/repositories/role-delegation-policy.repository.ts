import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { sql } from "kysely";

import { RoleDelegationPolicy } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { kysely } from "~infrastructure/database";
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
            const query = kysely
                .withRecursive("transitive_power", (cte) =>
                    cte
                        .selectFrom("access_control.role_delegation_policy as rdp")
                        .innerJoin("access_control.role_closure as rc", "rc.ancestor_id", "rdp.target_id")
                        .select(["rdp.realm_id", "rc.descendant_id as reachable_role_id"])
                        .distinct()
                        .where(sql<boolean>`rc.depth <= rdp.depth_limit`)
                        .whereRef("rc.realm_id", "=", "rdp.realm_id")
                        .where("rdp.delegator_id", "=", from)
                        .where("rdp.is_revoked", "=", false)
                        .where(sql<boolean>`(rdp.expires_at is null or rdp.expires_at > now())`)
                        .union(
                            cte
                                .selectFrom("access_control.role_delegation_policy as rdp")
                                .innerJoin("transitive_power as tp", (join) =>
                                    join
                                        .onRef("rdp.delegator_id", "=", "tp.reachable_role_id")
                                        .onRef("rdp.realm_id", "=", "tp.realm_id"),
                                )
                                .innerJoin("access_control.role_closure as rc", "rc.ancestor_id", "rdp.target_id")
                                .select(["rdp.realm_id", "rc.descendant_id as reachable_role_id"])
                                .distinct()
                                .where(sql<boolean>`rc.depth <= rdp.depth_limit`)
                                .whereRef("rc.realm_id", "=", "rdp.realm_id")
                                .where("rdp.is_revoked", "=", false)
                                .where(sql<boolean>`(rdp.expires_at is null or rdp.expires_at > now())`),
                        ),
                )
                .selectFrom("transitive_power")
                .select(sql<number>`1`.as("existsFlag"))
                .where("reachable_role_id", "in", targetIds)
                .limit(1)
                .compile();

            const [result] = await entityManager.execute<Repositories.RoleDelegationPolicy.ExistsRow[]>(
                query.sql,
                [...query.parameters],
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

            const query = kysely
                .with("actor_roles", (cte) =>
                    cte
                        .selectFrom("access_control.account_role_assignment as ara")
                        .select("ara.role_id")
                        .where("ara.realm_id", "=", realm)
                        .where("ara.account", "=", actor)
                        .where("ara.is_revoked", "=", false)
                        .where(sql<boolean>`(ara.expires_at is null or ara.expires_at > now())`),
                )
                // NOTE[SQL-02]: see NOTES.md#SQL-02
                .with("allowed_targets", (cte) =>
                    cte
                        .selectFrom("access_control.role_delegation_policy as rdp")
                        .innerJoin("actor_roles as ar", "ar.role_id", "rdp.delegator_id")
                        .innerJoin("access_control.role_closure as rc", "rc.ancestor_id", "rdp.target_id")
                        .select("rc.descendant_id as role_id")
                        .where("rdp.realm_id", "=", realm)
                        .where("rc.realm_id", "=", realm)
                        .where("rdp.is_revoked", "=", false)
                        .where(sql<boolean>`(rdp.expires_at is null or rdp.expires_at > now())`)
                        .where(sql<boolean>`rc.depth <= rdp.depth_limit`),
                )
                .selectFrom("allowed_targets as at")
                .select(sql<boolean>`count(distinct at.role_id)::int = ${roles.length}`.as("result"))
                .where("at.role_id", "in", roles)
                .compile();

            const [result] = await entityManager.execute<Repositories.RoleDelegationPolicy.AllowedRow[]>(
                query.sql,
                [...query.parameters],
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
