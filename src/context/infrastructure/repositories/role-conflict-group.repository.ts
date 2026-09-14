import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { sql } from "kysely";

import { RoleConflictGroup } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { kysely } from "~infrastructure/database";
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

            const query = kysely
                .with("violations", () => violationsBaseQuery)
                .selectFrom("violations as v")
                .innerJoin("access_control.role_conflict_group as grp", "grp.id", "v.group")
                .selectAll("grp")
                .select("v.matchedCount")
                .compile();

            const rawRows = await entityManager.execute<Repositories.RoleConflictGroup.Row[]>(
                query.sql,
                [...query.parameters],
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

            const query = kysely
                .selectFrom(violationsBaseQuery.as("v"))
                .select(sql<number>`1`.as("exists"))
                .limit(1)
                .compile();

            const existsRows = await entityManager.execute<Repositories.RoleConflictGroup.ExistsRow[]>(
                query.sql,
                [...query.parameters],
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

            const query = kysely
                .selectFrom(accountViolationsBaseQuery.as("v"))
                .select(sql<number>`1`.as("exists"))
                .limit(1)
                .compile();

            const existsRows = await entityManager.execute<Repositories.RoleConflictGroup.ExistsRow[]>(
                query.sql,
                [...query.parameters],
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
            const query = this.getAccountsViolatingRuleQuery(props).compile();

            return await entityManager.execute<Repositories.RoleConflictGroup.AccountViolationRow[]>(
                query.sql,
                [...query.parameters],
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
            const baseQuery = kysely
                .selectFrom("access_control.role_conflict_member as mem")
                .innerJoin("access_control.role as role", "role.id", "mem.role_id")
                .innerJoin("access_control.account_role_assignment as arm", "arm.role_id", "mem.role_id")
                .innerJoin("access_control.role_conflict_group as grp", "grp.id", "mem.group_id")
                .select("mem.group_id as group_id")
                .where("mem.group_id", "in", props.groups)
                .where("grp.realm_id", "=", props.realm)
                .where("role.realm_id", "=", props.realm)
                .where("arm.realm_id", "=", props.realm)
                .where("mem.is_revoked", "=", false)
                .where("arm.is_revoked", "=", false)
                .where(sql<boolean>`(arm.expires_at is null or arm.expires_at > now())`)
                .groupBy(["mem.group_id", "arm.account", "grp.max_allowed"])
                .having(sql<boolean>`count(distinct arm.role_id) > grp.max_allowed`);

            const query = kysely
                .selectFrom(baseQuery.as("v"))
                .select(sql<number>`1`.as("exists"))
                .limit(1)
                .compile();

            const existsRows = await entityManager.execute<Repositories.RoleConflictGroup.ExistsRow[]>(
                query.sql,
                [...query.parameters],
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
        const assignedRoles = kysely
            .selectFrom("access_control.account_role_assignment as arm")
            .select(sql<string>`"arm"."role_id"::uuid`.as("role_id"))
            .where("arm.realm_id", "=", props.realm)
            .where("arm.account", "=", props.account)
            .where("arm.is_revoked", "=", false)
            .where(sql<boolean>`(arm.expires_at is null or arm.expires_at > now())`);

        const directAfterCte = kysely
            .selectFrom(
                props.roles
                    .reduce(
                        (combined, role) => combined.union(kysely.selectNoFrom(sql<string>`${role}::uuid`.as("role_id"))),
                        assignedRoles,
                    )
                    .as("combined"),
            )
            .select(sql<string>`role_id::uuid`.as("role_id"));

        return kysely
            .with("direct_after", () => directAfterCte)
            .selectFrom("access_control.role_conflict_group as grp")
            .innerJoin("access_control.role_conflict_member as mem", "mem.group_id", "grp.id")
            .innerJoin("access_control.role as role", "role.id", "mem.role_id")
            .innerJoin("direct_after as da", "da.role_id", "mem.role_id")
            .select("grp.id as group")
            .select(sql<number>`count(distinct mem.role_id)::int`.as("matchedCount"))
            .where("grp.realm_id", "=", props.realm)
            .where("role.realm_id", "=", props.realm)
            .where("grp.is_revoked", "=", false)
            .where("mem.is_revoked", "=", false)
            .groupBy(["grp.id", "grp.max_allowed"])
            .having(sql<boolean>`count(distinct mem.role_id) > grp.max_allowed`);
    }

    public getAccountsViolatingRuleQuery(
        props: Repositories.RoleConflictGroup.GetAccountsViolatingRuleQuery.Props,
    ): Repositories.RoleConflictGroup.GetAccountsViolatingRuleQuery.Result {
        return kysely
            .selectFrom("access_control.account_role_assignment as arm")
            .innerJoin("access_control.role as role", "role.id", "arm.role_id")
            .select("arm.account as account")
            .select(sql<number>`count(distinct arm.role_id)::int`.as("matchedCount"))
            .where("arm.realm_id", "=", props.realm)
            .where("role.realm_id", "=", props.realm)
            .where("arm.role_id", "in", props.identifiers)
            .where("arm.is_revoked", "=", false)
            .where(sql<boolean>`(arm.expires_at is null or arm.expires_at > now())`)
            .groupBy("arm.account")
            .having(sql<boolean>`count(distinct arm.role_id) > ${props.maxAllowed}`);
    }
}
