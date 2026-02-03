import { EntityManager, FilterQuery, Loaded, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RoleConflictGroup } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupRepository {
    private readonly resource = "RoleConflictGroup";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {}

    public async create({ transaction, entity }: Repositories.RoleConflictGroup.Create): Promise<RoleConflictGroup> {
        try {
            const entityManager = transaction ?? this.writeManager;

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.RoleConflictGroup.Update): Promise<RoleConflictGroup> {
        try {
            const entityManager = transaction ?? this.writeManager;

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, realm, id }: Repositories.RoleConflictGroup.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager;
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

    public async bulkDelete({
        transaction,
        identifiers,
        realm,
    }: Repositories.RoleConflictGroup.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager;
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

    public findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictGroup.FindUnique<P, F>): Promise<Nullable<Loaded<RoleConflictGroup, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOne(RoleConflictGroup, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictGroup.FindUniqueOrThrow<P, F>): Promise<Loaded<RoleConflictGroup, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOneOrFail(RoleConflictGroup, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findMany<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictGroup.FindMany<P, F>): Promise<[Loaded<RoleConflictGroup, P, F>[], number]> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findAndCount(RoleConflictGroup, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findAssignmentViolation({
        transaction,
        account,
        role,
    }: Repositories.RoleConflictGroup.FindAssignmentViolation): Promise<RoleConflictGroup[]> {
        const entityManager = transaction ?? this.readManager;
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
    }
}
