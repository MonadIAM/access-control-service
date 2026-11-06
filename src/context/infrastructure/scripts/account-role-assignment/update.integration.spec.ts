import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "@jest/globals";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { LifecycleProjectionHelpers } from "~testing/integration/scripts/lifecycle.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - account-role-assignment/update", () => {
    const redis = redisSuite(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE);
    let fixture: LifecycleProjectionFixture;
    let helpers: LifecycleProjectionHelpers;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
        helpers = new LifecycleProjectionHelpers(redis.client());
    });

    it.each([true, false])("[case] - projects revocation state %s", async (isRevoked) => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.accountRoleAssignments.find((row) => row.id === scenario.assignment)!.is_revoked = !isRevoked;
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE, { realm, isRevoked, items: [scenario] });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual(
            isRevoked ? {} : { [scenario.code]: "0:0" },
        );
        expect(
            await redis.client().hget(`projection:account-role-assignment:${realm}:${account}:${role}`, "isRevoked"),
        ).toBe(isRevoked ? "1" : "0");
        await helpers.expectMembership(scenario, !isRevoked);
    });
});

describe("[Projection] - account-role-assignment/update event symmetry", () => {
    const redis = redisSuite(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE);
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
        await fixture.setRevoked(state.assignment, !isRevoked);
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const props = {
            realm: realm.id,
            actor: randomUUID(),
            context: { ip: "127.0.0.1", userAgent: "projection-symmetry" },
            global: true,
            input: { identifiers: [state.assignment.id], reason: "Projection symmetry" },
        };

        // Act
        if (isRevoked) {
            await context.commands.assignment.revoke(props);
        } else {
            await context.commands.assignment.restore(props);
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
});
