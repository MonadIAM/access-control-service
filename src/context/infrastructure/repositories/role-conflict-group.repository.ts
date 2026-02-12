import { EntityManager, Knex, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RoleConflictGroupAdapter } from "~context/infrastructure/adapters";
import { RoleConflictGroup } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupRepository
    extends RoleConflictGroupAdapter
    implements Repositories.RoleConflictGroup.Contract
{
    private readonly resource = "RoleConflictGroup";

    public constructor(@InjectEntityManager("read") private readonly readManager: EntityManager) {
        super();
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictGroup.FindUnique<P, F>): Promise<Nullable<Loaded<RoleConflictGroup, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(RoleConflictGroup, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictGroup.FindUniqueOrThrow<P, F>): Promise<Loaded<RoleConflictGroup, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(RoleConflictGroup, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.RoleConflictGroup.FindMany<P, F>,
    ): Promise<[Loaded<RoleConflictGroup, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(RoleConflictGroup, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(RoleConflictGroup, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findViolationDetails(
        props: Repositories.RoleConflictGroup.FindViolationDetails,
    ): Promise<RoleConflictGroup[]> {
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
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async hasViolations(props: Repositories.RoleConflictGroup.HasViolations): Promise<boolean> {
        try {
            const entityManager = props.transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();
            const violationsBaseQuery = this.getViolationsQuery(props);

            const existsRow = await entityManager.execute(
                knex.select(knex.raw("1 as exists")).from(violationsBaseQuery.as("v")).limit(1),
            );

            return existsRow.length > 0;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async hasAccountViolatingConflictGroup({
        transaction,
        identifiers,
        maxAllowed,
    }: Repositories.RoleConflictGroup.HasAccountViolatingConflictGroup): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const query = knex
                .select("arm.account_id")
                .from("access_control.account_role_matrix as arm")
                .whereIn("arm.role_id", identifiers)
                .groupBy("arm.account_id")
                .having(knex.raw("count(distinct arm.role_id) > ?", [maxAllowed]))
                .limit(1);

            const result = await entityManager.execute(query);

            return result.length > 0;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    private getViolationsQuery(props: Repositories.RoleConflictGroup.GetViolationsQuery): Knex.QueryBuilder {
        const entityManager = props.transaction ?? this.readManager.fork();
        const knex = entityManager.getKnex();

        const directAfterCte = knex.select(knex.raw("role_id::uuid")).from(
            knex
                .select(knex.raw('"arm"."role_id"::uuid as "role_id"'))
                .from({ arm: "access_control.account_role_matrix" })
                .where({ "arm.realm_id": props.realm, "arm.account_id": props.account })
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
