import { beforeEach, describe, expect, it } from "@jest/globals";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { LifecycleProjectionHelpers } from "~testing/integration/scripts/lifecycle.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - account-role-assignment/create", () => {
    const redis = redisSuite(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE);
    let fixture: LifecycleProjectionFixture;
    let helpers: LifecycleProjectionHelpers;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
        helpers = new LifecycleProjectionHelpers(redis.client());
    });

    it("[case] - creates canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.accountRoleAssignments = fixture.data.accountRoleAssignments.filter(
            (row) => row.id !== scenario.assignment,
        );
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE, {
            realm,
            account,
            assignments: [{ assignment: scenario.assignment, role }],
        });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [scenario.code]: "0:0",
        });
        expect(
            await redis.client().hget(`projection:account-role-assignment:${realm}:${account}:${role}`, "isRevoked"),
        ).toBe("0");
        await helpers.expectMembership(scenario, true);
    });

    it("[case] - assigns the third role with 19 source reads for 240 final permissions", async () => {
        // Arrange
        const { realm, account } = await fixture.permissionComposition([200, 20, 20]);
        const assignment = fixture.data.accountRoleAssignments.pop()!;
        await fixture.restore();
        const before = await helpers.commandCalls();

        // Act
        await fixture.execute(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE, {
            realm,
            account,
            assignments: [{ assignment: assignment.id, role: assignment.role_id }],
        });
        const after = await helpers.commandCalls();

        // Assert
        const expected = {
            time: 1,
            hget: 4,
            smembers: 2,
            hmget: 7,
            zrange: 3,
            hgetall: 3,
            hset: 5,
            sadd: 3,
            unlink: 2,
            zadd: 1,
        };
        expect(
            Object.fromEntries(
                Object.keys(expected).map((command) => [command, (after[command] ?? 0) - (before[command] ?? 0)]),
            ),
        ).toEqual(expected);
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual(
            Object.fromEntries(fixture.data.permissions.map(({ code }) => [code, "0:0"])),
        );
    });
});

describe("[Projection] - account-role-assignment/create event symmetry", () => {
    const redis = redisSuite(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it("[case] - agrees with PostgreSQL after creation", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const { realm, parent, child, sibling, permission, account } = await fixture.scenario();
        await fixture.createAccountRoleAssignment({ realm, role: sibling, account });
        await fixture.createRoleDelegationPolicy({ realm, delegator: sibling, target: child });
        await fixture.createRolePermissionAssignment({ realm, role: parent, permission });
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const meta: Extract.Meta = { ip: "127.0.0.1", userAgent: "projection-create" };

        // Act
        await context.commands.assignment.create({
            realm: realm.id,
            actor: account,
            context: meta,
            input: { account, roles: [child.id], justification: "Projection" },
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
