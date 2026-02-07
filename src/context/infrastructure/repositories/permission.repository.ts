import { EntityDictionary, EntityManager, FilterQuery, Knex, Loaded, raw, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { PermissionAdapter } from "~context/infrastructure/adapters";
import { PermissionOverrideEffect } from "~context/enums";
import { RepositoryException } from "~common/exceptions";
import { Permission } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionRepository extends PermissionAdapter implements Repositories.Permission.Contract {
    private readonly resource = "Permission";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {
        super();
    }

    public async create({ transaction, entity }: Repositories.Permission.Create): Promise<Permission> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.Permission.Update): Promise<Permission> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, realm, id }: Repositories.Permission.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
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

    public async bulkDelete({ transaction, identifiers, realm }: Repositories.Permission.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
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
            const entityManager = transaction ?? this.readManager.fork();
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
            const entityManager = transaction ?? this.readManager.fork();
            return entityManager.findOneOrFail(Permission, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findMany<P extends string = never, F extends string = "*">(
        props: Repositories.Permission.FindMany<P, F>,
    ): Promise<[Loaded<Permission, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return entityManager.findAndCount(Permission, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return entityManager.findAndCount(Permission, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getLookupList({
        pagination,
        realm,
        term,
    }: Repositories.Permission.GetLookupList): Promise<[Permission[], number]> {
        const entityManager = this.readManager.fork();
        const builder = entityManager.createQueryBuilder(Permission, "p");

        builder
            .select(["p.id", "p.code", "p.name"])
            .where({ "p.realm": realm })
            .limit(pagination.elementsPerPage)
            .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

        if (term) {
            builder.andWhere("p.name % ?", [term]).orderBy({
                [raw("similarity(p.name, ?)", [term])]: "DESC",
            });
        } else {
            builder.orderBy({ "p.name": "ASC" });
        }

        return await builder.getResultAndCount();
    }

    public async findEffectivePermissions({
        where: { account, realm },
        pagination,
        filters,
        sort,
    }: Repositories.Permission.FindEffectivePermissions): Promise<[Permission[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const buildEffectivePermissionIDs = (): Knex.QueryBuilder => {
                const accountRolesSubquery = knex
                    .select("rc.ancestor_id")
                    .distinct()
                    .from({ arm: "access_control.account_role_matrix" })
                    .join({ rc: "access_control.role_closure" }, "arm.role_id", "rc.descendant_id")
                    .where("arm.account_id", account)
                    .andWhere("arm.realm_id", realm)
                    .andWhere("arm.is_revoked", false);

                const rolePermissions = knex
                    .select("rpm.permission_id")
                    .distinct()
                    .from({ rpm: "access_control.role_permission_matrix" })
                    .whereIn("rpm.role_id", accountRolesSubquery)
                    .andWhere("rpm.is_revoked", false);

                const deniedPermissions = knex
                    .select("po.permission_id")
                    .from({ po: "access_control.permission_override" })
                    .where("po.account_id", account)
                    .andWhere("po.realm_id", realm)
                    .andWhere("po.effect", PermissionOverrideEffect.DENY)
                    .andWhere("po.is_revoked", false);

                const allowedOverrides = knex
                    .select("po.permission_id")
                    .from({ po: "access_control.permission_override" })
                    .where("po.account_id", account)
                    .andWhere("po.realm_id", realm)
                    .andWhere("po.effect", PermissionOverrideEffect.ALLOW)
                    .andWhere("po.is_revoked", false);

                const basePermissions = knex
                    .select("rp.permission_id")
                    .from(knex.raw("? as rp", [rolePermissions]))
                    .whereNotExists(
                        knex
                            .select(1)
                            .from(knex.raw("? as dp", [deniedPermissions]))
                            .whereRaw("dp.permission_id = rp.permission_id"),
                    );

                return knex
                    .select("bp.permission_id")
                    .from(knex.raw("? as bp", [basePermissions]))
                    .union([knex.select("ao.permission_id").from(knex.raw("? as ao", [allowedOverrides]))], true)
                    .distinct();
            };

            const dataQuery = knex
                .select("p.*")
                .from(knex.raw("? as effective", [buildEffectivePermissionIDs()]))
                .innerJoin({ p: "access_control.permission" }, "p.id", "effective.permission_id");

            super.buildWhereKnex(dataQuery, filters, "p");
            super.buildOptionsKnex(dataQuery, sort, pagination, "p");

            const countQuery = knex
                .count("* as total")
                .from(knex.raw("? as effective", [buildEffectivePermissionIDs()]))
                .innerJoin({ p: "access_control.permission" }, "p.id", "effective.permission_id");

            super.buildWhereKnex(countQuery, filters, "p");

            const [rawPermissions, countResult] = await Promise.all([
                dataQuery,
                countQuery.first<{ total: string | number }>(),
            ]);

            const total = parseInt(String(countResult?.total ?? 0), 10);

            const permissions: Permission[] = rawPermissions.map((raw: EntityDictionary<Permission>) => {
                return entityManager.map(Permission, raw);
            });

            return [permissions, total];
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async accountHasPermission({
        permission,
        account,
        realm,
        roles,
    }: Repositories.Permission.AccountHasPermission): Promise<boolean> {
        try {
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const effectiveRoles = knex
                .select("RC.ancestor_id as role_id")
                .distinct()
                .from({ RC: "access_control.role_closure" })
                .whereIn("RC.descendant_id", roles.length > 0 ? roles : [null]);

            const denyCheck = knex
                .select(knex.raw("1"))
                .from("access_control.permission_override")
                .where("account_id", account)
                .andWhere("permission_id", permission)
                .andWhere("realm_id", realm)
                .andWhere("effect", PermissionOverrideEffect.DENY)
                .andWhere("is_revoked", false);

            const allowCheck = knex
                .select(knex.raw("1"))
                .from("access_control.permission_override")
                .where("account_id", account)
                .andWhere("permission_id", permission)
                .andWhere("realm_id", realm)
                .andWhere("effect", PermissionOverrideEffect.ALLOW)
                .andWhere("is_revoked", false);

            const roleCheck = knex
                .select(knex.raw("1"))
                .from("access_control.role_permission_matrix")
                .whereIn("role_id", effectiveRoles)
                .andWhere("permission_id", permission)
                .andWhere("is_revoked", false);

            const result = await knex
                .select(
                    knex.raw(`EXISTS (${denyCheck}) as has_deny`),
                    knex.raw(`EXISTS (${allowCheck}) as has_allow`),
                    knex.raw(`EXISTS (${roleCheck}) as has_role_access`),
                )
                .first<{ [K in "has_deny" | "has_allow" | "has_role_access"]: boolean }>();

            if (!result) {
                return false;
            } else if (result.has_deny) {
                return false;
            } else if (result.has_allow) {
                return true;
            } else {
                return result.has_role_access;
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
