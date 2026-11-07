import { beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";
import { PermissionOverrideEffect } from "~context/enums";

import { ProjectionScript } from "../index";

describe("[Projection] - permission-override/purge", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_OVERRIDE_PURGE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - purges canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.overridePermission(scenario);
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.PERMISSION_OVERRIDE_PURGE, { realm, items: [scenario] });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({});
        expect(await redis.client().exists(`projection:permission-override:${realm}:${account}:${permission}`)).toBe(0);
    });
});

describe("[Projection] - permission-override/purge event symmetry", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_OVERRIDE_PURGE);
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
        const override = await fixture.createPermissionOverride({
            realm,
            permission,
            account,
            effect: PermissionOverrideEffect.DENY,
        });
        await fixture.setRevoked(override, true);
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const props = {
            realm: realm.id,
            actor: randomUUID(),
            context: { ip: "127.0.0.1", userAgent: "projection-symmetry" },
            global: true,
            input: { identifiers: [override.id], reason: "Projection symmetry" },
        };

        // Act
        await context.commands.override.purge(props);

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
        expect(await redis.client().exists(`projection:permission-override:${realm.id}:${account}:${permission.id}`)).toBe(
            0,
        );
    });
});
