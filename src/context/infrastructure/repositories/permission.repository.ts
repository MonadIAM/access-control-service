import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { raw } from "@mikro-orm/postgresql";
import { sql } from "kysely";

import { PermissionOverrideEffect, AssignmentScope } from "~context/enums";
import { Permission } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { kysely } from "~infrastructure/database";
import { BaseRepository } from "~common/mixins";

import { PermissionMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionRepository
    extends BaseRepository<Entities.Permission, Repositories.Mappers.Permission.Types, typeof PermissionMapper>({
        Mapper: PermissionMapper,
        Entity: Permission,
    })
    implements Repositories.Permission.Contract
{
    protected readonly permissionLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.permissionLimit = this.configService.getOrThrow<number>("PERMISSION_PER_REALM_LIMIT");
    }

    public async getLookupList(
        props: Repositories.Permission.GetLookupList.Props,
    ): Repositories.Permission.GetLookupList.Result {
        try {
            const { pagination, realm, term } = props;
            const entityManager = this.readManager.fork();
            const builder = entityManager.createQueryBuilder(Permission, "p");

            builder
                .select(["p.id", "p.code", "p.name"])
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            if (realm) {
                builder.where({ "p.realm": realm });
            }

            if (term) {
                builder
                    .andWhere("p.name % ?", [term])
                    .orderBy([{ [raw("similarity(p.name, ?)", [term])]: "DESC" }, { "p.name": "ASC" }, { "p.id": "ASC" }]);
            } else {
                builder.orderBy({ "p.name": "ASC", "p.id": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findEffective(
        props: Repositories.Permission.FindEffective.Props,
    ): Repositories.Permission.FindEffective.Result {
        try {
            const { pagination, filters, where, sort } = props;
            const entityManager = this.readManager.fork();

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            // NOTE[SQL-06]: see NOTES.md#SQL-06
            const accountRolesSubquery = kysely
                .selectFrom("access_control.account_role_assignment as arm")
                .innerJoin("access_control.role_closure as rc", "arm.role_id", "rc.descendant_id")
                .innerJoin("access_control.role as assigned", "assigned.id", "arm.role_id")
                .innerJoin("access_control.role as ancestor", "ancestor.id", "rc.ancestor_id")
                .select("rc.ancestor_id")
                .distinct()
                .where("arm.account", "=", where.account)
                .where("arm.realm_id", "=", where.realm)
                .where("arm.is_revoked", "=", false)
                .where("assigned.is_revoked", "=", false)
                .where("ancestor.is_revoked", "=", false)
                .whereRef("assigned.realm_id", "=", "arm.realm_id")
                .whereRef("ancestor.realm_id", "=", "arm.realm_id")
                .where(sql<boolean>`(arm.expires_at is null or arm.expires_at > now())`)
                .whereRef("rc.realm_id", "=", "arm.realm_id");

            const rolePermissions = kysely
                .selectFrom("access_control.role_permission_assignment as rpm")
                .select("rpm.permission_id")
                .distinct()
                .where("rpm.role_id", "in", accountRolesSubquery)
                .where("rpm.is_revoked", "=", false)
                .where("rpm.realm_id", "=", where.realm)
                .where((eb) =>
                    eb.or([eb("rpm.scope", "=", AssignmentScope.REALM), eb("rpm.realm_id", "=", SYSTEM_REALM_ID)]),
                );

            const deniedPermissions = kysely
                .selectFrom("access_control.permission_override as po")
                .select("po.permission_id")
                .where("po.account", "=", where.account)
                .where("po.realm_id", "=", where.realm)
                .where("po.effect", "=", PermissionOverrideEffect.DENY)
                .where("po.is_revoked", "=", false)
                .where(sql<boolean>`(po.expires_at is null or po.expires_at > now())`);

            const allowedOverrides = kysely
                .selectFrom("access_control.permission_override as po")
                .select("po.permission_id")
                .where("po.account", "=", where.account)
                .where("po.realm_id", "=", where.realm)
                .where("po.effect", "=", PermissionOverrideEffect.ALLOW)
                .where("po.is_revoked", "=", false)
                .where(sql<boolean>`(po.expires_at is null or po.expires_at > now())`);

            const basePermissions = kysely
                .selectFrom(rolePermissions.as("rp"))
                .select("rp.permission_id")
                .where((eb) =>
                    eb.not(
                        eb.exists(
                            eb
                                .selectFrom(deniedPermissions.as("dp"))
                                .select(sql`1`.as("matched"))
                                .whereRef("dp.permission_id", "=", "rp.permission_id"),
                        ),
                    ),
                );

            const effectivePermissionIds = kysely
                .selectFrom(basePermissions.as("bp"))
                .select("bp.permission_id")
                .union(kysely.selectFrom(allowedOverrides.as("ao")).select("ao.permission_id"))
                .distinct();

            const activeRealm = kysely.selectFrom("access_control.realm").select("id").where("is_revoked", "=", false);

            const effectivePermissions = kysely
                .selectFrom(effectivePermissionIds.as("effective"))
                .innerJoin("access_control.permission as p", "p.id", "effective.permission_id")
                .where("p.is_revoked", "=", false)
                .where((eb) => eb.exists(activeRealm.where("id", "=", where.realm)))
                .where((eb) =>
                    eb.or([
                        eb("p.realm_id", "=", where.realm),
                        eb.and([
                            eb("p.realm_id", "=", SYSTEM_REALM_ID),
                            eb.exists(activeRealm.where("id", "=", SYSTEM_REALM_ID)),
                        ]),
                    ]),
                )
                .$call((query) => super.buildWhereKysely(query, filters, "p"));

            const dataQuery = effectivePermissions
                .selectAll("p")
                .$call((query) => super.buildOptionsKysely(query, sort, pagination, "p"))
                .compile();

            const countQuery = effectivePermissions.select((eb) => eb.fn.countAll().as("total")).compile();

            const [rawPermissions, countRow] = await Promise.all([
                entityManager.execute<Repositories.Permission.Row[]>(dataQuery.sql, [...dataQuery.parameters], "all"),
                entityManager.execute<Repositories.Permission.CountRow>(countQuery.sql, [...countQuery.parameters], "get"),
            ]);

            const total = Number(countRow?.total ?? 0);

            const permissions: Entities.Permission[] = rawPermissions.map((permissionData) => {
                return entityManager.map(Permission, permissionData);
            });

            return [permissions, total];
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async collectEffective(
        props: Repositories.Permission.CollectEffective.Props,
    ): Repositories.Permission.CollectEffective.Result {
        try {
            const entityManager = this.readManager.fork();

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            // NOTE[SQL-06]: see NOTES.md#SQL-06
            const expandedRoles = kysely
                .selectFrom("access_control.account_role_assignment as arm")
                .innerJoin("access_control.role_closure as rc", "arm.role_id", "rc.descendant_id")
                .innerJoin("access_control.role as assigned", "assigned.id", "arm.role_id")
                .innerJoin("access_control.role as ancestor", "ancestor.id", "rc.ancestor_id")
                .select(["arm.realm_id", "rc.ancestor_id as role_id"])
                .distinct()
                .where("arm.account", "=", props.account)
                .where("arm.is_revoked", "=", false)
                .where("assigned.is_revoked", "=", false)
                .where("ancestor.is_revoked", "=", false)
                .whereRef("assigned.realm_id", "=", "arm.realm_id")
                .whereRef("ancestor.realm_id", "=", "arm.realm_id")
                .where(sql<boolean>`(arm.expires_at is null or arm.expires_at > now())`)
                .whereRef("rc.realm_id", "=", "arm.realm_id");

            const rolePermissions = kysely
                .selectFrom(expandedRoles.as("er"))
                .innerJoin("access_control.role_permission_assignment as rpa", "rpa.role_id", "er.role_id")
                .select(["er.realm_id", "rpa.permission_id", "rpa.scope"])
                .distinct()
                .where("rpa.is_revoked", "=", false)
                .whereRef("rpa.realm_id", "=", "er.realm_id")
                .where((eb) =>
                    eb.or([eb("rpa.scope", "=", AssignmentScope.REALM), eb("rpa.realm_id", "=", SYSTEM_REALM_ID)]),
                );

            const deniedPermissions = kysely
                .selectFrom("access_control.permission_override as po")
                .select(["po.realm_id", "po.permission_id"])
                .where("po.account", "=", props.account)
                .where("po.effect", "=", PermissionOverrideEffect.DENY)
                .where("po.is_revoked", "=", false)
                .where(sql<boolean>`(po.expires_at is null or po.expires_at > now())`);

            const allowedOverrides = kysely
                .selectFrom("access_control.permission_override as po")
                .select([
                    "po.realm_id",
                    "po.permission_id",
                    sql<AssignmentScope>`'REALM'::access_control.role_permission_assignment_scope`.as("scope"),
                ])
                .where("po.account", "=", props.account)
                .where("po.effect", "=", PermissionOverrideEffect.ALLOW)
                .where("po.is_revoked", "=", false)
                .where(sql<boolean>`(po.expires_at is null or po.expires_at > now())`);

            const basePermissions = kysely
                .selectFrom(rolePermissions.as("rp"))
                .select(["rp.realm_id", "rp.permission_id", "rp.scope"])
                .where((eb) =>
                    eb.not(
                        eb.exists(
                            eb
                                .selectFrom(deniedPermissions.as("dp"))
                                .select(sql`1`.as("matched"))
                                .whereRef("dp.permission_id", "=", "rp.permission_id")
                                .whereRef("dp.realm_id", "=", "rp.realm_id"),
                        ),
                    ),
                );

            const combined = kysely
                .selectFrom(basePermissions.as("bp"))
                .select(["bp.realm_id", "bp.permission_id", "bp.scope"])
                .union(
                    kysely.selectFrom(allowedOverrides.as("ao")).select(["ao.realm_id", "ao.permission_id", "ao.scope"]),
                );

            const query = kysely
                .selectFrom(combined.as("eff"))
                .innerJoin("access_control.permission as p", "p.id", "eff.permission_id")
                .innerJoin("access_control.realm as effective_realm", "effective_realm.id", "eff.realm_id")
                .select(["eff.realm_id as realm", "p.realm_id as permissionRealm", "p.code as permission", "eff.scope"])
                .where("p.is_revoked", "=", false)
                .where("effective_realm.is_revoked", "=", false)
                .where((eb) =>
                    eb.or([
                        eb("p.realm_id", "=", eb.ref("eff.realm_id")),
                        eb.and([
                            eb("p.realm_id", "=", SYSTEM_REALM_ID),
                            eb.exists(
                                eb
                                    .selectFrom("access_control.realm")
                                    .select("id")
                                    .where("id", "=", SYSTEM_REALM_ID)
                                    .where("is_revoked", "=", false),
                            ),
                        ]),
                    ]),
                )
                .$if(props.permissionRealm !== undefined, (query) => query.where("p.realm_id", "=", props.permissionRealm!))
                .distinct()
                .compile();

            return await entityManager.execute<Repositories.Permission.CollectEffective.Result>(
                query.sql,
                [...query.parameters],
                "all",
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findAccountsByPermissions(
        props: Repositories.Permission.FindAccountsByPermissions.Props,
    ): Repositories.Permission.FindAccountsByPermissions.Result {
        const { transaction, permissions } = props;
        const entityManager = transaction ?? this.readManager.fork();

        // NOTE[SQL-02]: see NOTES.md#SQL-02
        // NOTE[SQL-06]: see NOTES.md#SQL-06
        const viaRoles = kysely
            .selectFrom("access_control.role_permission_assignment as rpa")
            .innerJoin("access_control.permission as p", "p.id", "rpa.permission_id")
            .innerJoin("access_control.role_closure as rc", "rpa.role_id", "rc.ancestor_id")
            .innerJoin("access_control.account_role_assignment as ara", "ara.role_id", "rc.descendant_id")
            .select("ara.account")
            .distinct()
            .where("p.id", "in", permissions)
            .where("rpa.is_revoked", "=", false)
            .where("ara.is_revoked", "=", false)
            .where(sql<boolean>`(ara.expires_at is null or ara.expires_at > now())`)
            .whereRef("rpa.realm_id", "=", "p.realm_id")
            .whereRef("rc.realm_id", "=", "rpa.realm_id")
            .whereRef("ara.realm_id", "=", "rpa.realm_id");

        const viaOverrides = kysely
            .selectFrom("access_control.permission_override as po")
            .innerJoin("access_control.permission as p", "p.id", "po.permission_id")
            .select("po.account")
            .distinct()
            .where("p.id", "in", permissions)
            .where("po.is_revoked", "=", false)
            .where(sql<boolean>`(po.expires_at is null or po.expires_at > now())`)
            .whereRef("po.realm_id", "=", "p.realm_id");

        const query = viaRoles.union(viaOverrides).compile();

        const rows = await entityManager.execute<Repositories.Permission.AccountRow[]>(
            query.sql,
            [...query.parameters],
            "all",
        );

        return rows.map(({ account }) => account);
    }

    public async wouldExceedPermissionLimit(
        props: Repositories.Permission.WouldExceedPermissionLimit.Props,
    ): Repositories.Permission.WouldExceedPermissionLimit.Result {
        try {
            const { transaction, realm, count } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const total = await entityManager.count(Permission, { realm });

            return total + (count ?? 1) > this.permissionLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
