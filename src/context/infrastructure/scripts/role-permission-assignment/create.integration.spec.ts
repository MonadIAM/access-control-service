import { beforeEach, describe, expect, it } from "@jest/globals";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - role-permission-assignment/create", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_CREATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - creates canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.rolePermissionAssignments = fixture.data.rolePermissionAssignments.filter(
            (row) => row.id !== scenario.grant,
        );
        await fixture.restore();

        const sibling = await fixture.siblingPermission(scenario);
        const before = await redis.client().hgetall(`projection:role-permission-assignments:${realm}:${role}`);

        // Act
        await fixture.execute(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_CREATE, {
            realm,
            role,
            assignments: [{ assignment: scenario.grant, permission, permissionRealm: realm, scope: "REALM" }],
        });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [scenario.code]: "0:0",
            [sibling.code]: "0:0",
        });
        expect(
            await redis.client().hget(`projection:role-permission-assignments:${realm}:${role}`, `${permission}:isRevoked`),
        ).toBe("0");

        expect(await redis.client().hgetall(`projection:role-permission-assignments:${realm}:${role}`)).toEqual({
            ...before,
            [`${permission}:assignmentId`]: scenario.grant,
            [`${permission}:isRevoked`]: "0",
            [`${permission}:scope`]: "REALM",
            [`${permission}:permissionRealm`]: realm,
        });
    });
});

describe("[Projection] - role-permission-assignment/create event symmetry", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_CREATE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it("[case] - agrees with PostgreSQL after creation", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const { realm, parent, child, permission, account } = await fixture.scenario();
        await fixture.createAccountRoleAssignment({ realm, role: child, account });
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const meta: Extract.Meta = { ip: "127.0.0.1", userAgent: "projection-create" };

        // Act
        await context.commands.grant.create({
            realm: realm.id,
            actor: account,
            context: meta,
            input: { role: parent.id, permissions: [permission.id] },
        });

        // Assert
        await helpers.expectSymmetry({
            context,
            executor: redis.executor(),
            redis: redis.client(),
            realm: realm.id,
            account,
            permissionRealm: realm.id,
            expected: [permission.code],
        });
    });
});
