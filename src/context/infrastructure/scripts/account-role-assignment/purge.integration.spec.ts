import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "@jest/globals";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { LifecycleProjectionHelpers } from "~testing/integration/scripts/lifecycle.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - account-role-assignment/purge", () => {
    const redis = redisSuite(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE);
    let fixture: LifecycleProjectionFixture;
    let helpers: LifecycleProjectionHelpers;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
        helpers = new LifecycleProjectionHelpers(redis.client());
    });

    it("[case] - purges canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE, { realm, items: [scenario] });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({});
        expect(await redis.client().exists(`projection:account-role-assignment:${realm}:${account}:${role}`)).toBe(0);
        await helpers.expectMembership(scenario, false);
    });
});

describe("[Projection] - account-role-assignment/purge event symmetry", () => {
    const redis = redisSuite(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it("[case] - agrees with PostgreSQL after purge", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const state = await fixture.assigned();
        const { realm, account } = state;
        await fixture.setRevoked(state.assignment, true);
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
        await context.commands.assignment.purge(props);

        // Assert
        await helpers.expectSymmetry({
            context,
            executor: redis.executor(),
            redis: redis.client(),
            realm: realm.id,
            account,
            permissionRealm: realm.id,
            expected: [],
        });
        expect(
            await redis.client().exists(`projection:account-role-assignment:${realm.id}:${account}:${state.child.id}`),
        ).toBe(0);
    });
});
