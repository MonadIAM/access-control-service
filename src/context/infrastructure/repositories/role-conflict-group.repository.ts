import { EntityManager, FilterQuery, Loaded, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RoleConflictGroup } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupRepository implements Repositories.RoleConflictGroup.Contract {
    private readonly resource = "RoleConflictGroup";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {}

    public async create({ transaction, entity }: Repositories.RoleConflictGroup.Create): Promise<RoleConflictGroup> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.RoleConflictGroup.Update): Promise<RoleConflictGroup> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, realm, id }: Repositories.RoleConflictGroup.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<RoleConflictGroup> = {
                isSystemManaged: false,
                isRevoked: true,
                realm,
                id,
            };
            const affected = await entityManager.nativeDelete(RoleConflictGroup, where);
            if (!affected) {
                throw RepositoryException.notFound({ resource: this.resource });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkUpdate({
        transaction,
        updates,
    }: Repositories.RoleConflictGroup.BulkUpdate): Promise<RoleConflictGroup[]> {
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

    public async bulkDelete({
        transaction,
        identifiers,
        realm,
    }: Repositories.RoleConflictGroup.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<RoleConflictGroup> = {
                id: { $in: identifiers },
                isSystemManaged: false,
                isRevoked: true,
                realm,
            };
            return await entityManager.nativeDelete(RoleConflictGroup, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
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

    public async findMany<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictGroup.FindMany<P, F>): Promise<[Loaded<RoleConflictGroup, P, F>[], number]> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findAndCount(RoleConflictGroup, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findAssignmentViolation({
        transaction,
        account,
        role,
    }: Repositories.RoleConflictGroup.FindAssignmentViolation): Promise<RoleConflictGroup[]> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const affectedGroups = knex("access_control.role_closure as rc")
                .join("access_control.role_conflict_member as rcm", "rc.ancestor_id", "rcm.role_id")
                .where("rc.descendant_id", role)
                .andWhere((builder) => {
                    builder.where("rc.depth", 0).orWhere("rcm.is_inheritable", true);
                })
                .select("rcm.group_id");

            const rawResults = await knex("access_control.role_conflict_group as rcg")
                .select("rcg.*")
                .select(knex.raw("count(distinct arm.role_id) as current_count"))
                .join("access_control.role_conflict_member as rcm", "rcg.id", "rcm.group_id")
                .join("access_control.role_closure as rc_member", "rcm.role_id", "rc_member.ancestor_id")
                .join("access_control.account_role_matrix as arm", "rc_member.descendant_id", "arm.role_id")
                .whereIn("rcg.id", affectedGroups)
                .andWhere("arm.account_id", account)
                .andWhere("arm.is_revoked", false)
                .andWhere((builder) => {
                    builder.where("rc_member.depth", 0).orWhere("rcm.is_inheritable", true);
                })
                .groupBy("rcg.id");

            const result: RoleConflictGroup[] = [];

            for (const row of rawResults) {
                if (row.currentCount + 1 > row.maxAllowed) {
                    result.push(entityManager.map(RoleConflictGroup, row));
                }
            }

            return result;
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

            const effectiveRoleIdsQuery = knex("access_control.role_closure as rc")
                .whereIn("rc.ancestor_id", identifiers)
                .select("rc.descendant_id");

            const query = knex
                .select("arm.account_id")
                .from("access_control.account_role_matrix as arm")
                .whereIn("arm.role_id", effectiveRoleIdsQuery)
                .groupBy("arm.account_id")
                .having(knex.raw("count(distinct arm.role_id) > ?", [maxAllowed]))
                .limit(1);

            const result = await entityManager.execute(query);

            return result.length > 0;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async wouldRolesViolateSoDPolicy({
        transaction,
        account,
        roles,
    }: Repositories.RoleConflictGroup.WouldRolesViolateSoDPolicy): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const currentDirectRoles = await knex("access_control.account_role_matrix")
                .select("role_id")
                .where({ account_id: account, is_revoked: false })
                .pluck("role_id");

            const allDirectRoleIds = [...new Set([...currentDirectRoles, ...roles])];

            const allEffectiveRoleIds = await knex("access_control.role_closure")
                .whereIn("ancestor_id", allDirectRoleIds)
                .pluck("descendant_id")
                .then((descendants) => [...new Set([...allDirectRoleIds, ...descendants])]);

            const violation = await knex("access_control.role_conflict_group as grp")
                .join("access_control.role_conflict_member as mem", "mem.group_id", "grp.id")
                .whereIn("mem.role_id", allEffectiveRoleIds)
                .andWhere("grp.is_revoked", false)
                .andWhere("mem.is_revoked", false)
                .groupBy("grp.id", "grp.name", "grp.max_allowed")
                .havingRaw("COUNT(DISTINCT mem.role_id) > grp.max_allowed")
                .select("grp.name", "grp.max_allowed", knex.raw("COUNT(DISTINCT mem.role_id) as matched_count"))
                .first();

            if (violation) {
                return false;
            } else {
                return true;
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
