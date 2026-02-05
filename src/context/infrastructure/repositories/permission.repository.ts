import { AnyEntity, EntityManager, FilterQuery, Loaded, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RolePermissionMatrix, PermissionOverride, Permission } from "~context/domain/entities";
import { PermissionOverrideEffect } from "~context/enums";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionRepository implements Repositories.Permission.Contract {
    private readonly resource = "Permission";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {}

    public async create({ transaction, entity }: Repositories.Permission.Create): Promise<Permission> {
        try {
            const entityManager = transaction ?? this.writeManager;

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.Permission.Update): Promise<Permission> {
        try {
            const entityManager = transaction ?? this.writeManager;

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, realm, id }: Repositories.Permission.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager;
            const where: FilterQuery<Permission> = {
                isSystemManaged: false,
                isRevoked: true,
                realm,
                id,
            };
            const affected = await entityManager.nativeDelete(Permission, where);
            if (!affected) {
                throw RepositoryException.notFound({ resource: this.resource });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkUpdate({ transaction, updates }: Repositories.Permission.BulkUpdate): Promise<Permission[]> {
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

    public async bulkDelete({ transaction, identifiers, realm }: Repositories.Permission.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager;
            const where: FilterQuery<Permission> = {
                id: { $in: identifiers },
                isSystemManaged: false,
                isRevoked: true,
                realm,
            };
            return await entityManager.nativeDelete(Permission, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Permission.FindUnique<P, F>): Promise<Nullable<Loaded<Permission, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOne(Permission, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Permission.FindUniqueOrThrow<P, F>): Promise<Loaded<Permission, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOneOrFail(Permission, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findMany<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Permission.FindMany<P, F>): Promise<[Loaded<Permission, P, F>[], number]> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findAndCount(Permission, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    /**
     * TODO: Важно следить за SLA запроса, чтобы время ег овыполнения не выходило за 100мс.
     */
    public findEffectivePermissions({
        transaction,
        pagination,
        account,
    }: Repositories.Permission.FindEffectivePermissions): Promise<[Permission[], number]> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.transactional(async (transaction: EntityManager) => {
                const knex = transaction.getKnex();

                const accountRoles = knex
                    .select("R.*")
                    .distinct("R.id")
                    .from({ R: "access_control.role" })
                    .join({ RC: "access_control.role_closure" }, "R.id", "RC.ancestor_id")
                    .join({ ARM: "access_control.account_role_matrix" }, "RC.descendant_id", "ARM.role_id")
                    .where("ARM.account_id", account)
                    .andWhere("ARM.is_revoked", false)
                    .orderBy("R.id", "asc");

                const rolePermissionsQuery = knex
                    .select("assignings.permission_id")
                    .from("access_control.role_permission_matrix as assignings")
                    .where("assignings.is_revoked", false)
                    .whereIn("assignings.role_id", accountRoles)
                    .distinct();

                const deniedPermissionsQuery = knex
                    .select("overrides.permission_id")
                    .from("access_control.permission_override as overrides")
                    .where("overrides.account_id", account)
                    .andWhere("overrides.effect", PermissionOverrideEffect.DENY)
                    .andWhere("overrides.is_revoked", false);

                const allowedOverridesQuery = knex
                    .select("overrides.permission_id")
                    .from("access_control.permission_override as overrides")
                    .where("overrides.account_id", account)
                    .andWhere("overrides.effect", PermissionOverrideEffect.ALLOW)
                    .andWhere("overrides.is_revoked", false);

                const basePermissionsQuery = knex
                    .select("BasePerms.permission_id")
                    .from(knex.raw("? as BasePerms", rolePermissionsQuery))
                    .except(
                        knex.select("DeniedPerms.permission_id").from(knex.raw("? as DeniedPerms", deniedPermissionsQuery)),
                    );

                const effectivePermissionIDsQuery = knex
                    .select("CleanedPerms.permission_id")
                    .from(knex.raw("? as CleanedPerms", basePermissionsQuery))
                    .union(
                        [
                            knex
                                .select("ExplicitAllows.permission_id")
                                .from(knex.raw("? as ExplicitAllows", allowedOverridesQuery)),
                        ],
                        true,
                    )
                    .distinct();

                const totalCountResult = await knex
                    .count("* as total")
                    .from(effectivePermissionIDsQuery.as("FinalIDs"))
                    .first();

                const count = parseInt(totalCountResult?.total ?? 0, 10);

                const rawPermissions = await knex
                    .select("permission.*")
                    .from(effectivePermissionIDsQuery.as("FinalIDs"))
                    .innerJoin("access_control.permission as permission", "permission.id", "FinalIDs.permission_id")
                    .orderBy("permission.createdAt", "asc")
                    .limit(pagination?.elementsPerPage)
                    .offset((pagination?.currentPage - 1) * pagination?.elementsPerPage);

                const permissions: Permission[] = rawPermissions.map((raw: AnyEntity) => {
                    return transaction.map(Permission, raw);
                });

                return [permissions, count];
            });
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async accountHasPermission({
        accountRoles,
        transaction,
        permission,
        accountId,
    }: Repositories.Permission.AccountHasPermission): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager;
            const override = await entityManager.findOne(PermissionOverride, {
                isRevoked: false,
                permission,
                accountId,
            });

            if (override) {
                return override.effect !== PermissionOverrideEffect.DENY;
            } else {
                const roleAccessCount = await entityManager.count(RolePermissionMatrix, {
                    role: { id: { $in: accountRoles } },
                    permission: { id: permission },
                    isRevoked: false,
                });
                return roleAccessCount > 0;
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
