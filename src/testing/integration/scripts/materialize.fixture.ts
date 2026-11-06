import { bootstrap } from "@monadiam/shared/datasets/system/access-control";
import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { randomUUID } from "node:crypto";
import Redis from "ioredis";

import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { AssignmentScope, PermissionOverrideEffect, RoleArchetype } from "~context/enums";

import { SnapshotProjectionFixture } from "./snapshot.fixture";

export class MaterializeProjectionFixture extends CoreFixture {
    public async scenario(system = false): Promise<Integration.Projection.Materialize.Scenario> {
        const realm = await this.createRealm(system ? { id: SYSTEM_REALM_ID, code: "system" } : {});
        const parent = await this.createRole({ realm, archetype: RoleArchetype.COMPOSITE });
        const child = await this.createRole({ realm, archetype: RoleArchetype.COMPOSITE });
        const sibling = await this.createRole({ realm, archetype: RoleArchetype.COMPOSITE });
        await this.createRoleClosure({ realm, ancestor: parent, descendant: child, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: parent, descendant: sibling, depth: 1 });
        const permission = await this.createPermission({ realm, code: "test.inherited" });
        return { realm, parent, child, sibling, permission, account: randomUUID() };
    }

    public async assigned(withGrant = true): Promise<Integration.Projection.Materialize.Assigned> {
        const state = await this.scenario();
        const { realm, parent, child, permission, account } = state;
        const standby = await this.createRole({ realm });
        await this.createAccountRoleAssignment({ realm, role: standby, account });
        const assignment = await this.createAccountRoleAssignment({ realm, role: child, account });
        const grant = await this.createRolePermissionAssignment({ realm, role: parent, permission });
        if (!withGrant) {
            grant.isRevoked = true;
            await this.entityManager.flush();
        }
        return { ...state, grant, assignment };
    }

    public async globalScenario(localDeny = false, globalDeny = false): Promise<Integration.Projection.Materialize.Global> {
        const system = await this.scenario(true);
        const local = await this.createRealm();
        const role = await this.createRole({ realm: local });
        await this.createAccountRoleAssignment({ realm: system.realm, role: system.child, account: system.account });
        await this.createAccountRoleAssignment({ realm: local, role, account: system.account });
        const grant = await this.createRolePermissionAssignment({
            realm: system.realm,
            role: system.parent,
            permission: system.permission,
        });
        grant.scope = AssignmentScope.GLOBAL;
        await this.entityManager.flush();
        const localGrant = await this.createRolePermissionAssignment({ realm: local, role, permission: system.permission });
        for await (const realm of [localDeny ? local : undefined, globalDeny ? system.realm : undefined]) {
            if (realm) {
                await this.createPermissionOverride({
                    realm,
                    account: system.account,
                    permission: system.permission,
                    effect: PermissionOverrideEffect.DENY,
                });
            }
        }
        return { ...system, local, role, grant, localGrant };
    }

    public async expiring(effect?: PermissionOverrideEffect): Promise<Integration.Projection.Materialize.Expiring> {
        const state = await this.scenario();
        const { realm, parent, child, sibling, permission, account } = state;
        const first = await this.createAccountRoleAssignment({ realm, role: child, account });
        const second = await this.createAccountRoleAssignment({ realm, role: sibling, account });
        const grant = await this.createRolePermissionAssignment({ realm, role: parent, permission });
        grant.isRevoked = effect === PermissionOverrideEffect.ALLOW;
        const deadline = new Date(Date.now() + 1500);
        first.expiresAt = new Date(Date.now() - 1000);
        if (effect) {
            const override = await this.createPermissionOverride({ realm, permission, account, effect });
            override.expiresAt = deadline;
        } else {
            second.expiresAt = deadline;
        }
        await this.entityManager.flush();
        return { ...state, deadline };
    }

    public async bootstrapPermissions(): Promise<void> {
        const realm = await this.createRealm({ id: SYSTEM_REALM_ID, code: "system" });
        for await (const code of bootstrap.ADMIN_PERMISSION_CODES) {
            await this.createPermission({ realm, code });
        }
    }

    public async setRevoked(entity: { isRevoked: boolean }, isRevoked: boolean): Promise<void> {
        entity.isRevoked = isRevoked;
        await this.entityManager.flush();
    }

    public async snapshot(redis: Redis): Promise<void> {
        const tables = {
            realms: "select * from access_control.realm",
            roles: "select * from access_control.role",
            permissions: "select * from access_control.permission",
            roleClosures: "select * from access_control.role_closure",
            accountRoleAssignments: "select * from access_control.account_role_assignment",
            rolePermissionAssignments:
                "select a.*, p.realm_id as permission_realm_id from access_control.role_permission_assignment a join access_control.permission p on p.id=a.permission_id",
            permissionOverrides:
                "select a.*, p.realm_id as permission_realm_id from access_control.permission_override a join access_control.permission p on p.id=a.permission_id",
        };
        const entries = await Promise.all(
            Object.entries(tables).map(async ([name, query]) => [name, await this.entityManager.execute(query)]),
        );
        await new SnapshotProjectionFixture(redis).restore(
            Object.fromEntries(entries) as Fixtures.Projection.Snapshot.Data,
        );
    }
}
