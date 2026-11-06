import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import Redis from "ioredis";

import { readProjectionSource } from "~context/infrastructure/scripts/source";
import { ProjectionScript } from "~context/infrastructure/scripts";

import { SnapshotProjectionFixture } from "./snapshot.fixture";

export class LifecycleProjectionFixture implements Fixtures.Projection.Lifecycle.Contract {
    public readonly data: Fixtures.Projection.Snapshot.Data = {
        realms: [],
        roles: [],
        permissions: [],
        roleClosures: [],
        accountRoleAssignments: [],
        rolePermissionAssignments: [],
        permissionOverrides: [],
    };

    public constructor(
        private readonly redis: Redis,
        private readonly executor: InfrastructureServices.ScriptExecutor.Contract,
    ) {}

    public async probe(payload: object, mutation?: string): Promise<unknown> {
        const source = await readProjectionSource(
            resolve("src/testing/integration/scripts/probe.lua"),
            mutation,
            resolve("src/context/infrastructure/scripts"),
        );
        return await this.redis.eval(source, 0, JSON.stringify(payload));
    }

    public async restore(): Promise<void> {
        await new SnapshotProjectionFixture(this.redis).restore(this.data);
    }

    public async execute(script: ProjectionScript, payload: object): Fixtures.Projection.Lifecycle.Execute.Result {
        return await this.executor.execute({ script, args: [JSON.stringify(payload)] });
    }

    public async createScenario(
        props: Fixtures.Projection.Lifecycle.CreateScenario.Props = {},
    ): Fixtures.Projection.Lifecycle.CreateScenario.Result {
        const scenario = this.identities();
        this.data.realms.push({ id: scenario.realm, is_revoked: false });
        if (scenario.permissionRealm !== scenario.realm) {
            this.data.realms.push({ id: scenario.permissionRealm, is_revoked: false });
        }
        this.data.roles.push({ id: scenario.role, realm_id: scenario.realm, is_revoked: false });
        this.data.roleClosures.push({
            realm_id: scenario.realm,
            ancestor_id: scenario.role,
            descendant_id: scenario.role,
            depth: 0,
        });
        if (props.permission !== false) {
            this.data.permissions.push({
                id: scenario.permission,
                realm_id: scenario.permissionRealm,
                code: scenario.code,
                is_revoked: false,
            });
        }
        await this.restore();
        return scenario;
    }

    public async assignRole(
        scenario: Fixtures.Projection.Lifecycle.Scenario,
    ): Fixtures.Projection.Lifecycle.AssignRole.Result {
        this.data.accountRoleAssignments.push({
            id: scenario.assignment,
            realm_id: scenario.realm,
            role_id: scenario.role,
            account: scenario.account,
            is_revoked: false,
        });
        await this.restore();
    }

    public async inheritedScenario(): Promise<Fixtures.Projection.Lifecycle.Scenario & { parent: string }> {
        const scenario = await this.createScenario();
        await this.grantPermission(scenario);
        const child = { ...scenario, parent: scenario.role, role: randomUUID() };
        this.data.roles.push({ id: child.role, realm_id: child.realm, is_revoked: false });
        this.data.roleClosures.push(
            { realm_id: child.realm, ancestor_id: child.role, descendant_id: child.role, depth: 0 },
            { realm_id: child.realm, ancestor_id: scenario.role, descendant_id: child.role, depth: 1 },
        );
        await this.assignRole(child);
        return child;
    }

    public async grantPermission(
        scenario: Fixtures.Projection.Lifecycle.Scenario,
        scope = "REALM",
    ): Fixtures.Projection.Lifecycle.GrantPermission.Result {
        this.data.rolePermissionAssignments.push({
            id: scenario.grant,
            realm_id: scenario.realm,
            role_id: scenario.role,
            permission_id: scenario.permission,
            permission_realm_id: scenario.permissionRealm,
            scope,
            is_revoked: false,
        });
        await this.restore();
    }

    public async overridePermission(
        scenario: Fixtures.Projection.Lifecycle.Scenario,
        effect = "ALLOW",
    ): Fixtures.Projection.Lifecycle.OverridePermission.Result {
        this.data.permissionOverrides.push({
            id: scenario.override,
            realm_id: scenario.realm,
            account: scenario.account,
            permission_id: scenario.permission,
            permission_realm_id: scenario.permissionRealm,
            effect,
            is_revoked: false,
        });
        await this.restore();
    }

    public async temporalScenario(
        effect: string,
        grantDuration: number,
        overrideDuration: number,
    ): Promise<{ scenario: Fixtures.Projection.Lifecycle.Scenario; grantedUntil: number; overriddenUntil: number }> {
        const scenario = await this.inheritedScenario();
        const now = Date.now();
        const grantedUntil = grantDuration === 0 ? 0 : now + grantDuration;
        const overriddenUntil = overrideDuration === 0 ? 0 : now + overrideDuration;
        this.data.accountRoleAssignments[0].expires_at = grantedUntil;
        await this.overridePermission(scenario, effect);
        this.data.permissionOverrides[0].expires_at = overriddenUntil;
        await this.restore();
        return { scenario, grantedUntil, overriddenUntil };
    }

    public async permissionSet(count: number): Promise<Fixtures.Projection.Lifecycle.Scenario> {
        return await this.permissionComposition([count]);
    }

    public async permissionComposition(counts: number[]): Promise<Fixtures.Projection.Lifecycle.Scenario> {
        const scenario = await this.createScenario({ permission: false });
        for (const [roleIndex, count] of counts.entries()) {
            const role = roleIndex === 0 ? scenario.role : randomUUID();
            if (roleIndex > 0) {
                this.data.roles.push({ id: role, realm_id: scenario.realm, is_revoked: false });
                this.data.roleClosures.push({ realm_id: scenario.realm, ancestor_id: role, descendant_id: role, depth: 0 });
            }
            this.data.accountRoleAssignments.push({
                id: roleIndex === 0 ? scenario.assignment : randomUUID(),
                realm_id: scenario.realm,
                role_id: role,
                account: scenario.account,
                is_revoked: false,
            });
            for (let index = 0; index < count; index += 1) {
                const permission = randomUUID();
                this.data.permissions.push({
                    id: permission,
                    realm_id: scenario.realm,
                    code: `test.permission.${roleIndex}.${index}`,
                    is_revoked: false,
                });
                this.data.rolePermissionAssignments.push({
                    id: randomUUID(),
                    realm_id: scenario.realm,
                    role_id: role,
                    permission_id: permission,
                    permission_realm_id: scenario.realm,
                    scope: "REALM",
                    is_revoked: false,
                });
            }
        }
        await this.restore();
        return scenario;
    }

    public async siblingPermission(
        scenario: Fixtures.Projection.Lifecycle.Scenario,
    ): Promise<Fixtures.Projection.Lifecycle.Scenario> {
        const sibling = { ...scenario, permission: randomUUID(), grant: randomUUID(), code: `${scenario.code}.sibling` };
        this.data.permissions.push({
            id: sibling.permission,
            realm_id: sibling.permissionRealm,
            code: sibling.code,
            is_revoked: false,
        });
        await this.grantPermission(sibling);
        return sibling;
    }

    public async overrideAccounts(scenario: Fixtures.Projection.Lifecycle.Scenario, count: number): Promise<void> {
        for (let index = 0; index < count; index += 1) {
            this.data.permissionOverrides.push({
                id: randomUUID(),
                realm_id: scenario.realm,
                account: randomUUID(),
                permission_id: scenario.permission,
                permission_realm_id: scenario.permissionRealm,
                effect: "ALLOW",
                is_revoked: false,
            });
        }
        await this.restore();
    }

    public async seedScenario(
        props: Fixtures.Projection.Lifecycle.SeedScenario.Props,
    ): Fixtures.Projection.Lifecycle.SeedScenario.Result {
        const scenario = this.identities();
        const { realm, permissionRealm, permission, account, override, code } = scenario;
        await this.seed({
            realms: [{ id: realm, is_revoked: false }],
            roles: [],
            roleClosures: [],
            accountRoleAssignments: [],
            rolePermissionAssignments: [],
            permissions: [{ id: permission, realm_id: permissionRealm, code, is_revoked: false }],
            permissionOverrides: [
                {
                    id: override,
                    permission_realm_id: permissionRealm,
                    permission_id: permission,
                    realm_id: realm,
                    is_revoked: props.isRevoked,
                    effect: props.effect,
                    account,
                },
            ],
        });
        return scenario;
    }

    public async seed(data: Fixtures.Projection.Snapshot.Data): Promise<void> {
        const source = await readProjectionSource(
            resolve("src/infrastructure/redis/scripts/seed.lua"),
            "seed",
            resolve("src/context/infrastructure/scripts"),
        );
        await this.redis.eval(source, 0, JSON.stringify(data));
    }

    private identities(): Fixtures.Projection.Lifecycle.Scenario {
        const realm = randomUUID();
        return {
            permissionRealm: realm,
            permission: randomUUID(),
            assignment: randomUUID(),
            override: randomUUID(),
            account: randomUUID(),
            grant: randomUUID(),
            realm,
            role: randomUUID(),
            code: "test.permission",
        };
    }
}
