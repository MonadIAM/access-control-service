import { beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - role-permission-assignment/purge", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_PURGE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - purges canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        await fixture.restore();

        const sibling = await fixture.siblingPermission(scenario);
        const before = await redis.client().hgetall(`projection:role-permission-assignments:${realm}:${role}`);

        // Act
        await fixture.execute(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_PURGE, { realm, items: [scenario] });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [sibling.code]: "0:0",
        });
        expect(
            await redis
                .client()
                .hexists(`projection:role-permission-assignments:${realm}:${role}`, `${permission}:assignmentId`),
        ).toBe(0);

        expect(await redis.client().hgetall(`projection:role-permission-assignments:${realm}:${role}`)).toEqual(
            Object.fromEntries(Object.entries(before).filter(([field]) => !field.startsWith(`${permission}:`))),
        );
    });
});

describe("[Projection] - role-permission-assignment/purge event symmetry", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_PURGE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it("[case] - agrees with PostgreSQL after purge", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const state = await fixture.assigned();
        const { realm, permission, account } = state;
        await fixture.setRevoked(state.grant, true);
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
        await context.commands.grant.purge(props);

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
            await redis
                .client()
                .hexists(
                    `projection:role-permission-assignments:${realm.id}:${state.parent.id}`,
                    `${permission.id}:assignmentId`,
                ),
        ).toBe(0);
    });
});
