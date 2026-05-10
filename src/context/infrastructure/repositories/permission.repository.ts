import { EntityDictionary, EntityManager, Knex, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PermissionAdapter } from "~context/infrastructure/adapters";
import { PermissionOverrideEffect } from "~context/enums";
import { RepositoryException } from "~common/exceptions";
import { Permission } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionRepository
    extends BaseRepository<Entities.Permission, Adapters.Permission.Types>({
        Adapter: PermissionAdapter,
        Entity: Permission,
    })
    implements Repositories.Permission.InternalContract
{
    protected readonly permissionLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.permissionLimit = this.configService.getOrThrow<number>("PERMISSION_PER_REALM_LIMIT");
    }

    public async getLookupList({
        pagination,
        realm,
        term,
    }: Repositories.Permission.GetLookupList): Promise<[Entities.Permission[], number]> {
        try {
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
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }

    public async findEffective({
        where: { account, realm },
        pagination,
        filters,
        sort,
    }: Repositories.Permission.FindEffective): Promise<[Entities.Permission[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const buildEffectivePermissionIDs = (): Knex.QueryBuilder => {
                const accountRolesSubquery = knex
                    .select("rc.ancestor_id")
                    .distinct()
                    .from({ arm: "access_control.account_role_assignment" })
                    .join({ rc: "access_control.role_closure" }, "arm.role_id", "rc.descendant_id")
                    .where("arm.account", account)
                    .andWhere("arm.realm_id", realm)
                    .andWhere("arm.is_revoked", false);

                const rolePermissions = knex
                    .select("rpm.permission_id")
                    .distinct()
                    .from({ rpm: "access_control.role_permission_assignment" })
                    .whereIn("rpm.role_id", accountRolesSubquery)
                    .andWhere("rpm.is_revoked", false);

                const deniedPermissions = knex
                    .select("po.permission_id")
                    .from({ po: "access_control.permission_override" })
                    .where("po.account", account)
                    .andWhere("po.realm_id", realm)
                    .andWhere("po.effect", PermissionOverrideEffect.DENY)
                    .andWhere("po.is_revoked", false);

                const allowedOverrides = knex
                    .select("po.permission_id")
                    .from({ po: "access_control.permission_override" })
                    .where("po.account", account)
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

            super.buildWhereKnex?.(dataQuery, filters, "p");
            super.buildOptionsKnex?.(dataQuery, sort, pagination, "p");

            const countQuery = knex
                .count("* as total")
                .from(knex.raw("? as effective", [buildEffectivePermissionIDs()]))
                .innerJoin({ p: "access_control.permission" }, "p.id", "effective.permission_id");

            super.buildWhereKnex?.(countQuery, filters, "p");

            const [rawPermissions, countResult] = await Promise.all([
                dataQuery,
                countQuery.first<{ total: string | number }>(),
            ]);

            const total = parseInt(String(countResult?.total ?? 0), 10);

            const permissions: Entities.Permission[] = rawPermissions.map((raw: EntityDictionary<Entities.Permission>) => {
                return entityManager.map(Permission, raw);
            });

            return [permissions, total];
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }

    public async collectEffective(
        props: Repositories.Permission.CollectEffective.Props,
    ): Promise<Repositories.Permission.CollectEffective.Result> {
        try {
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const expandedRoles = knex
                .select("arm.realm_id", "rc.ancestor_id as role_id")
                .distinct()
                .from({ arm: "access_control.account_role_assignment" })
                .join({ rc: "access_control.role_closure" }, "arm.role_id", "rc.descendant_id")
                .where("arm.account", props.account)
                .andWhere("arm.is_revoked", false);

            const rolePermissions = knex
                .select("er.realm_id", "rpa.permission_id", "rpa.scope")
                .distinct()
                .from(knex.raw("? as er", [expandedRoles]))
                .join({ rpa: "access_control.role_permission_assignment" }, "rpa.role_id", "er.role_id")
                .andWhere("rpa.is_revoked", false);

            const deniedPermissions = knex
                .select("po.realm_id", "po.permission_id")
                .from({ po: "access_control.permission_override" })
                .where("po.account", props.account)
                .andWhere("po.effect", PermissionOverrideEffect.DENY)
                .andWhere("po.is_revoked", false);

            const allowedOverrides = knex
                .select("po.realm_id", "po.permission_id", knex.raw("'REALM' as scope"))
                .from({ po: "access_control.permission_override" })
                .where("po.account", props.account)
                .andWhere("po.effect", PermissionOverrideEffect.ALLOW)
                .andWhere("po.is_revoked", false);

            const basePermissions = knex
                .select("rp.realm_id", "rp.permission_id", "rp.scope")
                .from(knex.raw("? as rp", [rolePermissions]))
                .whereNotExists(
                    knex
                        .select(1)
                        .from(knex.raw("? as dp", [deniedPermissions]))
                        .whereRaw("dp.permission_id = rp.permission_id AND dp.realm_id = rp.realm_id"),
                );

            const combined = knex
                .select("bp.realm_id", "bp.permission_id", "bp.scope")
                .from(knex.raw("? as bp", [basePermissions]))
                .union(
                    [
                        knex
                            .select("ao.realm_id", "ao.permission_id", "ao.scope")
                            .from(knex.raw("? as ao", [allowedOverrides])),
                    ],
                    true,
                );

            const results = await knex
                .select("eff.realm_id as realm", "p.code as permission", "eff.scope")
                .from(knex.raw("? as eff", [combined]))
                .join({ p: "access_control.permission" }, "p.id", "eff.permission_id")
                .distinct();

            return results;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }

    public async findAccountsByPermissions({
        transaction,
        permissions,
    }: Repositories.Permission.FindAccountsByPermissions): Promise<string[]> {
        const entityManager = transaction ?? this.readManager.fork();
        const knex = entityManager.getKnex();

        const viaRoles = knex
            .select("ara.account")
            .distinct()
            .from({ rpa: "access_control.role_permission_assignment" })
            .join({ rc: "access_control.role_closure" }, "rpa.role_id", "rc.ancestor_id")
            .join({ ara: "access_control.account_role_assignment" }, "ara.role_id", "rc.descendant_id")
            .whereIn("rpa.permission_id", permissions)
            .andWhere("rpa.is_revoked", false)
            .andWhere("ara.is_revoked", false);

        const viaOverrides = knex
            .select("po.account")
            .distinct()
            .from({ po: "access_control.permission_override" })
            .whereIn("po.permission_id", permissions)
            .andWhere("po.is_revoked", false);

        const results = await viaRoles.union([viaOverrides]);

        return results.map(({ account }) => account);
    }

    public async wouldExceedPermissionLimit({
        transaction,
        realm,
        count,
    }: Repositories.Permission.WouldExceedPermissionLimit): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total }] = await knex("access_control.permission").where("realm_id", realm).count("id as total");

            return Number(total) + (count ?? 1) > this.permissionLimit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }
}
