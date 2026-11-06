import { beforeEach, describe, expect, it } from "@jest/globals";
import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - role-permission-assignment/update", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it.each([true, false])("[case] - projects revocation state %s", async (isRevoked) => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.rolePermissionAssignments.find((row) => row.id === scenario.grant)!.is_revoked = !isRevoked;
        await fixture.restore();

        const sibling = await fixture.siblingPermission(scenario);
        const before = await redis.client().hgetall(`projection:role-permission-assignments:${realm}:${role}`);

        // Act
        await fixture.execute(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE, {
            realm,
            isRevoked,
            items: [{ ...scenario, assignment: scenario.grant, scope: "REALM" }],
        });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [sibling.code]: "0:0",
            ...(isRevoked ? {} : { [scenario.code]: "0:0" }),
        });
        expect(
            await redis.client().hget(`projection:role-permission-assignments:${realm}:${role}`, `${permission}:isRevoked`),
        ).toBe(isRevoked ? "1" : "0");

        expect(await redis.client().hgetall(`projection:role-permission-assignments:${realm}:${role}`)).toEqual({
            ...before,
            [`${permission}:isRevoked`]: isRevoked ? "1" : "0",
        });
    });
});

describe("[Projection] - role-permission-assignment/update event symmetry", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it.each([true, false])("[case] - agrees with PostgreSQL after isRevoked=%s", async (isRevoked) => {
        // Arrange
        const fixture = suite.fixtures();
        const state = await fixture.assigned();
        const { realm, permission, account } = state;
        await fixture.setRevoked(state.grant, !isRevoked);
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const props = {
            realm: realm.id,
            actor: randomUUID(),
            context: { ip: "127.0.0.1", userAgent: "projection-symmetry" },
            global: true,
            input: { identifiers: [state.grant.id], reason: "Projection symmetry" },
        };

        // Act
        if (isRevoked) {
            await context.commands.grant.revoke(props);
        } else {
            await context.commands.grant.restore(props);
        }

        // Assert
        await helpers.expectSymmetry({
            context,
            executor: redis.executor(),
            redis: redis.client(),
            realm: realm.id,
            account,
            permissionRealm: realm.id,
            expected: isRevoked ? [] : [permission.code],
        });
    });

    it.each([true, false])("[case] - projects GLOBAL revocation=%s without changing the local grant", async (isRevoked) => {
        // Arrange
        const fixture = suite.fixtures();
        const state = await fixture.globalScenario();
        const { local, permission, account, grant } = state;
        await fixture.setRevoked(grant, !isRevoked);
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const props = {
            realm: SYSTEM_REALM_ID,
            actor: randomUUID(),
            context: { ip: "127.0.0.1", userAgent: "projection-global" },
            input: { identifiers: [grant.id], reason: "Projection symmetry" },
        };

        // Act
        if (isRevoked) {
            await context.commands.grant.revoke(props);
        } else {
            await context.commands.grant.restore(props);
        }

        // Assert
        await helpers.expectSymmetry({
            context,
            executor: redis.executor(),
            redis: redis.client(),
            realm: local.id,
            account,
            permissionRealm: SYSTEM_REALM_ID,
            expected: [permission.code],
            global: isRevoked ? [] : [permission.code],
        });
    });
});
