import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleConflictGroupAdapter } from "~context/infrastructure/adapters";
import { RoleConflictGroup } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupRepository
    extends BaseRepository<Entities.RoleConflictGroup, Adapters.RoleConflictGroup.Types>({
        Adapter: RoleConflictGroupAdapter,
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

    public async findViolationDetails(
        props: Repositories.RoleConflictGroup.FindViolationDetails.Props,
    ): Repositories.RoleConflictGroup.FindViolationDetails.Result {
        try {
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const violationsBaseQuery = this.getViolationsQuery(props);

            const rawRows = await entityManager.execute(
                knex
                    .with("violations", violationsBaseQuery)
                    .select("grp.*")
                    .select(knex.raw('v.matched_count as "matchedCount"'))
                    .from({ v: "violations" })
                    .join({ grp: "access_control.role_conflict_group" }, "grp.id", "v.group_id"),
            );

            return rawRows.map((row) => entityManager.map(RoleConflictGroup, row));
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async hasViolations(
        props: Repositories.RoleConflictGroup.HasViolations.Props,
    ): Repositories.RoleConflictGroup.HasViolations.Result {
        try {
            const entityManager = props.transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();
            const violationsBaseQuery = this.getViolationsQuery(props);

            const existsRow = await entityManager.execute(
                knex.select(knex.raw("1 as exists")).from(violationsBaseQuery.as("v")).limit(1),
            );

            return existsRow.length > 0;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async hasAccountViolating(
        props: Repositories.RoleConflictGroup.HasAccountViolating.Props,
    ): Repositories.RoleConflictGroup.HasAccountViolating.Result {
        try {
            const { transaction, identifiers, maxAllowed } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const query = knex
                .select("arm.account")
                .from("access_control.account_role_assignment as arm")
                .whereIn("arm.role_id", identifiers)
                .groupBy("arm.account")
                .having(knex.raw("count(distinct arm.role_id) > ?", [maxAllowed]))
                .limit(1);

            const result = await entityManager.execute(query);

            return result.length > 0;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async wouldExceedGroupLimit(
        props: Repositories.RoleConflictGroup.WouldExceedGroupLimit.Props,
    ): Repositories.RoleConflictGroup.WouldExceedGroupLimit.Result {
        try {
            const { transaction, realm, count } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total }] = await knex("access_control.role_conflict_group")
                .where("realm_id", realm)
                .andWhere("is_revoked", false)
                .count("id as total");

            return Number(total) + (count ?? 1) > this.groupLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public getViolationsQuery(
        props: Repositories.RoleConflictGroup.GetViolationsQuery.Props,
    ): Repositories.RoleConflictGroup.GetViolationsQuery.Result {
        const entityManager = props.transaction ?? this.readManager.fork();
        const knex = entityManager.getKnex();

        const directAfterCte = knex.select(knex.raw("role_id::uuid")).from(
            knex
                .select(knex.raw('"arm"."role_id"::uuid as "role_id"'))
                .from({ arm: "access_control.account_role_assignment" })
                .where({ "arm.realm_id": props.realm, "arm.account": props.account })
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
            .join({ da: "direct_after" }, "da.role_id", "mem.role_id")
            .where("grp.realm_id", props.realm)
            .groupBy("grp.id", "grp.max_allowed")
            .havingRaw("count(distinct mem.role_id) > grp.max_allowed");
    }
}
