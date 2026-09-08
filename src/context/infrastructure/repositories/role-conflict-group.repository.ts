import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleConflictGroup } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { knex } from "~infrastructure/database";
import { BaseRepository } from "~common/mixins";

import { RoleConflictGroupMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupRepository
    extends BaseRepository<Entities.RoleConflictGroup, Repositories.Mappers.RoleConflictGroup.Types>({
        Mapper: RoleConflictGroupMapper,
        Entity: RoleConflictGroup,
    })
    implements Repositories.RoleConflictGroup.Contract
{
    protected readonly groupLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.groupLimit = this.configService.getOrThrow<number>("CONFLICT_GROUP_PER_REALM_LIMIT");
    }

    public async findGroupsViolatedByAccount(
        props: Repositories.RoleConflictGroup.FindGroupsViolatedByAccount.Props,
    ): Repositories.RoleConflictGroup.FindGroupsViolatedByAccount.Result {
        try {
            const entityManager = this.readManager.fork();
            const violationsBaseQuery = this.getGroupsViolatedByAccountQuery(props);

            const query = knex
                .with("violations", violationsBaseQuery)
                .select("grp.*")
                .select(knex.raw('v.matched_count as "matchedCount"'))
                .from({ v: "violations" })
                .join({ grp: "access_control.role_conflict_group" }, "grp.id", "v.group_id")
                .toSQL();

            const rawRows = await entityManager.execute<Repositories.RoleConflictGroup.Row[]>(
                query.sql,
                [...query.bindings],
                "all",
            );

            return rawRows.map((row) => entityManager.map(RoleConflictGroup, row));
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async hasGroupsViolatedByAccount(
        props: Repositories.RoleConflictGroup.HasGroupsViolatedByAccount.Props,
    ): Repositories.RoleConflictGroup.HasGroupsViolatedByAccount.Result {
        try {
            const entityManager = props.transaction ?? this.readManager.fork();
            const violationsBaseQuery = this.getGroupsViolatedByAccountQuery(props);

            const query = knex.select(knex.raw("1 as exists")).from(violationsBaseQuery.as("v")).limit(1).toSQL();

            const existsRows = await entityManager.execute<Repositories.RoleConflictGroup.ExistsRow[]>(
                query.sql,
                [...query.bindings],
                "all",
            );

            return existsRows.length > 0;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async hasAccountsViolatingRule(
        props: Repositories.RoleConflictGroup.HasAccountsViolatingRule.Props,
    ): Repositories.RoleConflictGroup.HasAccountsViolatingRule.Result {
        try {
            const entityManager = props.transaction ?? this.readManager.fork();
            const accountViolationsBaseQuery = this.getAccountsViolatingRuleQuery(props);

            const query = knex.select(knex.raw("1 as exists")).from(accountViolationsBaseQuery.as("v")).limit(1).toSQL();

            const existsRows = await entityManager.execute<Repositories.RoleConflictGroup.ExistsRow[]>(
                query.sql,
                [...query.bindings],
                "all",
            );

            return existsRows.length > 0;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findAccountsViolatingRule(
        props: Repositories.RoleConflictGroup.FindAccountsViolatingRule.Props,
    ): Repositories.RoleConflictGroup.FindAccountsViolatingRule.Result {
        try {
            const entityManager = props.transaction ?? this.readManager.fork();
            const query = this.getAccountsViolatingRuleQuery(props).toSQL();

            return await entityManager.execute<Repositories.RoleConflictGroup.AccountViolationRow[]>(
                query.sql,
                [...query.bindings],
                "all",
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async hasGroupsWithViolatingAccounts(
        props: Repositories.RoleConflictGroup.HasGroupsWithViolatingAccounts.Props,
    ): Repositories.RoleConflictGroup.HasGroupsWithViolatingAccounts.Result {
        try {
            const entityManager = props.transaction ?? this.readManager.fork();
            const baseQuery = knex
                .select("mem.group_id as group_id")
                .from({ mem: "access_control.role_conflict_member" })
                .join({ role: "access_control.role" }, "role.id", "mem.role_id")
                .join({ arm: "access_control.account_role_assignment" }, "arm.role_id", "mem.role_id")
                .join({ grp: "access_control.role_conflict_group" }, "grp.id", "mem.group_id")
                .whereIn("mem.group_id", props.groups)
                .where("grp.realm_id", props.realm)
                .where("role.realm_id", props.realm)
                .where("arm.realm_id", props.realm)
                .where("grp.is_revoked", false)
                .where("mem.is_revoked", false)
                .where("arm.is_revoked", false)
                .whereRaw("(arm.expires_at is null or arm.expires_at > now())")
                .groupBy("mem.group_id", "arm.account", "grp.max_allowed")
                .havingRaw("count(distinct arm.role_id) > grp.max_allowed");

            const query = knex.select(knex.raw("1 as exists")).from(baseQuery.as("v")).limit(1).toSQL();

            const existsRows = await entityManager.execute<Repositories.RoleConflictGroup.ExistsRow[]>(
                query.sql,
                [...query.bindings],
                "all",
            );

            return existsRows.length > 0;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async wouldExceedGroupLimit(
        props: Repositories.RoleConflictGroup.WouldExceedGroupLimit.Props,
    ): Repositories.RoleConflictGroup.WouldExceedGroupLimit.Result {
        try {
            const { transaction, realm, count } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const total = await entityManager.count(RoleConflictGroup, { realm, isRevoked: false });

            return total + (count ?? 1) > this.groupLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public getGroupsViolatedByAccountQuery(
        props: Repositories.RoleConflictGroup.GetGroupsViolatedByAccountQuery.Props,
    ): Repositories.RoleConflictGroup.GetGroupsViolatedByAccountQuery.Result {
        // NOTE[SQL-02]: see NOTES.md#SQL-02
        // NOTE[SQL-06]: see NOTES.md#SQL-06
        const directAfterCte = knex.select(knex.raw("role_id::uuid")).from(
            knex
                .select(knex.raw('"arm"."role_id"::uuid as "role_id"'))
                .from({ arm: "access_control.account_role_assignment" })
                .where({ "arm.realm_id": props.realm, "arm.account": props.account })
                .andWhere("arm.is_revoked", false)
                .andWhereRaw("(arm.expires_at is null or arm.expires_at > now())")
                .union(
                    props.roles.map((role) => knex.select(knex.raw('?::uuid as "role_id"', [role]))),
                    true,
                )
                .as("combined"),
        );

        return knex
            .with("direct_after", directAfterCte)
            .select("grp.id as group_id")
            .select(knex.raw("count(distinct mem.role_id)::int as matched_count"))
            .from({ grp: "access_control.role_conflict_group" })
            .join({ mem: "access_control.role_conflict_member" }, "mem.group_id", "grp.id")
            .join({ role: "access_control.role" }, "role.id", "mem.role_id")
            .join({ da: "direct_after" }, "da.role_id", "mem.role_id")
            .where("grp.realm_id", props.realm)
            .where("role.realm_id", props.realm)
            .where("grp.is_revoked", false)
            .where("mem.is_revoked", false)
            .groupBy("grp.id", "grp.max_allowed")
            .havingRaw("count(distinct mem.role_id) > grp.max_allowed");
    }

    public getAccountsViolatingRuleQuery(
        props: Repositories.RoleConflictGroup.GetAccountsViolatingRuleQuery.Props,
    ): Repositories.RoleConflictGroup.GetAccountsViolatingRuleQuery.Result {
        return knex
            .select("arm.account as account")
            .select(knex.raw("count(distinct arm.role_id)::int as matched_count"))
            .from({ arm: "access_control.account_role_assignment" })
            .join({ role: "access_control.role" }, "role.id", "arm.role_id")
            .where("arm.realm_id", props.realm)
            .where("role.realm_id", props.realm)
            .whereIn("arm.role_id", props.identifiers)
            .where("arm.is_revoked", false)
            .whereRaw("(arm.expires_at is null or arm.expires_at > now())")
            .groupBy("arm.account")
            .havingRaw("count(distinct arm.role_id) > ?", [props.maxAllowed]);
    }
}
