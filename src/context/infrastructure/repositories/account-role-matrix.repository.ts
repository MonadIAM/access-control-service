import { EntityManager, FilterQuery, Loaded, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccountRoleMatrix } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleMatrixRepository {
    private readonly resource = "AccountRoleMatrix";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
        private readonly configService: ConfigService,
    ) {}

    public async create({ transaction, entity }: Repositories.AccountRoleMatrix.Create): Promise<AccountRoleMatrix> {
        try {
            const entityManager = transaction ?? this.writeManager;

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.AccountRoleMatrix.Update): Promise<AccountRoleMatrix> {
        try {
            const entityManager = transaction ?? this.writeManager;

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, realm, id }: Repositories.AccountRoleMatrix.Delete): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.writeManager;
            const where: FilterQuery<AccountRoleMatrix> = {
                isSystemManaged: false,
                isRevoked: true,
                realm,
                id,
            };
            const affected = await entityManager.nativeDelete(AccountRoleMatrix, where);
            if (affected > 0) {
                return true;
            } else {
                throw RepositoryException.notFound({ resource: this.resource });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkCreate({
        transaction,
        entities,
    }: Repositories.AccountRoleMatrix.BulkCreate): Promise<AccountRoleMatrix[]> {
        try {
            const entityManager = transaction ?? this.writeManager;

            entityManager.persist(entities);
            await entityManager.flush();

            return entities;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkUpdate({
        transaction,
        updates,
    }: Repositories.AccountRoleMatrix.BulkUpdate): Promise<AccountRoleMatrix[]> {
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
        accountId,
        realm,
    }: Repositories.AccountRoleMatrix.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager;
            const where: FilterQuery<AccountRoleMatrix> = {
                ...(identifiers ? { id: { $in: identifiers } } : { accountId }),
                isSystemManaged: false,
                isRevoked: true,
                realm,
            };
            return await entityManager.nativeDelete(AccountRoleMatrix, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AccountRoleMatrix.FindUnique<P, F>): Promise<Nullable<Loaded<AccountRoleMatrix, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOne(AccountRoleMatrix, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AccountRoleMatrix.FindUniqueOrThrow<P, F>): Promise<Loaded<AccountRoleMatrix, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOneOrFail(AccountRoleMatrix, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findMany<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AccountRoleMatrix.FindMany<P, F>): Promise<[Loaded<AccountRoleMatrix, P, F>[], number]> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findAndCount(AccountRoleMatrix, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async existsActiveAccountWithConflictRoles({
        transaction,
        identifiers,
        maxAllowed,
    }: Repositories.AccountRoleMatrix.ExistsActiveAccountWithBothRoles): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager;
            const knex = entityManager.getKnex();

            const effectiveRoleIdsQuery = knex("access_control.role_closure as rc")
                .whereIn("rc.ancestor_id", identifiers)
                .select("rc.descendant_id");

            const query = knex
                .select("arm.account_id")
                .from("access_control.account_role_matrix as arm")
                .whereIn("arm.role_id", effectiveRoleIdsQuery)
                .andWhere("arm.is_revoked", false)
                .groupBy("arm.account_id")
                .having(knex.raw("count(distinct arm.role_id) > ?", [maxAllowed]))
                .limit(1);

            const result = await entityManager.execute(query);

            return result.length > 0;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async validateDelegationForRoles({
        transaction,
        actor,
        roles,
    }: Repositories.AccountRoleMatrix.ValidateDelegationForRoles): Promise<void> {
        try {
            const entityManager = transaction ?? this.readManager;
            const knex = entityManager.getKnex();

            const forbiddenRole = await knex
                .select(knex.raw(1))
                .from(knex.raw(`(VALUES ${roles.map(() => "(?)").join(", ")}) AS target(role_id)`, roles))
                .whereNotExists((existsBuilder) => {
                    existsBuilder
                        .select(knex.raw(1))
                        .from("access_control.role_delegation_policy as policy")
                        .join("access_control.account_role_matrix as matrix", "matrix.role_id", "policy.delegator_role_id")
                        .whereRaw("policy.target_role_id = CAST(target.role_id AS UUID)")
                        .andWhere({
                            "matrix.account_id": actor,
                            "matrix.is_revoked": false,
                            "policy.is_revoked": false,
                        });
                })
                .limit(1)
                .first();

            if (forbiddenRole) {
                throw RepositoryException.badRequest("repository.custom.insufficient_role_permissions");
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async validateSoDForNewRoles({
        transaction,
        accountId,
        roles,
    }: Repositories.AccountRoleMatrix.ValidateSoDForNewRoles): Promise<void> {
        try {
            const entityManager = transaction ?? this.readManager;
            const knex = entityManager.getKnex();

            const currentDirectRoles = await knex("access_control.account_role_matrix")
                .select("role_id")
                .where({ account_id: accountId, is_revoked: false })
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
                throw RepositoryException.badRequest("repository.custom.separation_of_duties", { group: violation.name });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async validateSystemConstraintsForNewRoles({
        transaction,
        accountId,
        roles,
    }: Repositories.AccountRoleMatrix.ValidateSystemConstraintsForNewRoles): Promise<void> {
        try {
            const limit = this.configService.getOrThrow<number>("ROLE_LIMIT");
            const entityManager = transaction ?? this.readManager;
            const knex = entityManager.getKnex();

            const assignments = await knex("access_control.account_role_matrix as matrix")
                .join("access_control.role as role", "role.id", "matrix.role_id")
                .where("matrix.account_id", accountId)
                .forUpdate()
                .select("matrix.role_id", "matrix.is_revoked", "role.is_system_managed");

            const existingRoleIds = new Set(assignments.map((assignment) => assignment.role_id));
            const trulyNewCount = roles.filter((id) => !existingRoleIds.has(id)).length;

            if (assignments.length + trulyNewCount > limit) {
                throw RepositoryException.badRequest("repository.custom.role_limit_exceeded", { limit });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
