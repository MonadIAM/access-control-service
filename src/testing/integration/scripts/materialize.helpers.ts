import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { expect, jest } from "@jest/globals";
import Redis from "ioredis";

import { RolePermissionAssignmentIntegrationHelpers } from "~testing/integration/domain-service/role-permission-assignment.helpers";
import { AccountRoleAssignmentIntegrationHelpers } from "~testing/integration/domain-service/account-role-assignment.helpers";
import { PermissionOverrideIntegrationHelpers } from "~testing/integration/domain-service/permission-override.helpers";
import { RolePermissionAssignmentCommands } from "~context/application/commands/role-permission-assignment.commands";
import { AccountRoleAssignmentCommands } from "~context/application/commands/account-role-assignment.commands";
import { PermissionOverrideCommands } from "~context/application/commands/permission-override.commands";
import { PermissionIntegrationHelpers } from "~testing/integration/domain-service/permission.helpers";
import { ProjectionCacheService } from "~context/infrastructure/services/projection-cache.service";
import { RealmIntegrationHelpers } from "~testing/integration/domain-service/realm.helpers";
import { PermissionCommands } from "~context/application/commands/permission.commands";
import { RealmCommands } from "~context/application/commands/realm.commands";

import { RoleProjectionHelpers } from "./role.helpers";

export class MaterializeProjectionHelpers {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        executor: InfrastructureServices.ScriptExecutor.Contract,
        redis: Redis,
    ): Integration.Projection.Materialize.Context {
        const role = new RoleProjectionHelpers().service(context);
        const permission = new PermissionIntegrationHelpers().service(context, { permissionLimit: 20 });
        const assignment = new AccountRoleAssignmentIntegrationHelpers().service(context, { accountRoleLimit: 10 });
        const override = new PermissionOverrideIntegrationHelpers().service(context, { overrideLimit: 10 });
        const grant = new RolePermissionAssignmentIntegrationHelpers().service(context, { permissionLimit: 20 });
        const realm = new RealmIntegrationHelpers().service(context, { realmLimit: 10 });
        const cache = new ProjectionCacheService(executor);
        jest.spyOn(cache, "checkRealm").mockImplementation(async ({ realm, account }) => {
            const score = await redis.zscore(`projection:effective-realms:${account}`, realm);
            return score !== null && (score === "inf" || Number(score) > Date.now());
        });
        jest.spyOn(cache, "validateAssignments").mockImplementation(async ({ items }) => {
            const groups = new Map<string, { realm: string; account: string; remaining: number }>();
            const missing: string[] = [];
            const unique = new Map(items.map((item) => [`${item.realm}:${item.account}:${item.role}`, item]));
            for await (const { realm, account, role } of unique.values()) {
                const key = `${realm}:${account}`;
                if (!groups.has(key)) {
                    const remaining = await redis.scard(`projection:account-role-assignments:by-account:${key}`);
                    groups.set(key, { realm, account, remaining });
                }
                if (await redis.hexists(`projection:account-role-assignment:${key}:${role}`, "assignmentId")) {
                    groups.get(key)!.remaining -= 1;
                } else {
                    missing.push(role);
                }
            }
            return { missing, groups: [...groups.values()] };
        });
        const transaction = role.transactional.service;
        return {
            transactional: role.transactional,
            consumed: new Set(),
            permissions: permission.repositories.permissions,
            commands: {
                role: role.commands,
                realm: new RealmCommands(transaction, realm.realmService),
                permission: new PermissionCommands(transaction, permission.permissionService),
                grant: new RolePermissionAssignmentCommands(transaction, grant.rolePermissionAssignmentService),
                assignment: new AccountRoleAssignmentCommands(
                    transaction,
                    assignment.repositories.accountRoleAssignments,
                    assignment.accountRoleAssignmentService,
                    override.permissionOverrideService,
                    cache,
                ),
                override: new PermissionOverrideCommands(
                    transaction,
                    override.repositories.permissionOverrides,
                    override.permissionOverrideService,
                    cache,
                ),
            },
        };
    }

    public async consume(
        context: Integration.Projection.Materialize.Context,
        executor: InfrastructureServices.ScriptExecutor.Contract,
    ): Promise<void> {
        await new RoleProjectionHelpers().consumeProjection({
            context: { ...context, commands: context.commands.role },
            executor,
        });
    }

    public async expectSymmetry(props: Integration.Projection.Materialize.Assert): Promise<void> {
        const { context, executor, realm, account, permissionRealm } = props;
        await this.consume(context, executor);
        const sql = await context.permissions.collectEffective({ account, permissionRealm });
        const local = sql
            .filter((item) => item.realm === realm && item.scope === "REALM")
            .map((item) => item.permission)
            .sort();
        const global = sql
            .filter((item) => item.realm === SYSTEM_REALM_ID && item.scope === "GLOBAL")
            .map((item) => item.permission)
            .sort();
        const [listed] = await context.permissions.findEffective({
            where: { account, realm },
            pagination: { currentPage: 1, elementsPerPage: 1000 },
            filters: {},
            sort: {},
        });
        expect(
            listed
                .filter((item) => item.realm.id === permissionRealm)
                .map((item) => item.code)
                .sort(),
        ).toEqual([...new Set([...local, ...(realm === SYSTEM_REALM_ID ? global : [])])].sort());
        expect(local).toEqual(props.expected.slice().sort());
        expect(global).toEqual((props.global ?? []).slice().sort());
        const read = async (scope: string, target: string): Promise<string[]> => {
            const values = await props.redis.hgetall(
                `projection:effective:${scope}:${target}:${account}:${permissionRealm}`,
            );
            const now = Date.now();
            return Object.entries(values)
                .filter(([, value]) => {
                    const [from, until] = value.split(":").map(Number);
                    return from <= now && (until === 0 || until > now);
                })
                .map(([code]) => code)
                .sort();
        };
        const [projected, projectedGlobal] = await Promise.all([read("REALM", realm), read("GLOBAL", SYSTEM_REALM_ID)]);
        expect(projected).toEqual(local);
        expect(projectedGlobal).toEqual(global);
    }
}
