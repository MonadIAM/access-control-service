import { beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";
import { PermissionOverrideEffect } from "~context/enums";

import { ProjectionScript } from "../index";

describe("[Projection] - permission-override/update", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_OVERRIDE_UPDATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it.each([true, false])("[case] - projects revocation state %s", async (isRevoked) => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.overridePermission(scenario);
        fixture.data.permissionOverrides.find((row) => row.id === scenario.override)!.is_revoked = !isRevoked;
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.PERMISSION_OVERRIDE_UPDATE, {
            realm,
            isRevoked,
            items: [{ ...scenario, effect: "ALLOW" }],
        });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual(
            isRevoked ? {} : { [scenario.code]: "0:0" },
        );
        expect(
            await redis.client().hget(`projection:permission-override:${realm}:${account}:${permission}`, "isRevoked"),
        ).toBe(isRevoked ? "1" : "0");
    });
});

describe("[Projection] - permission-override/update event symmetry", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_OVERRIDE_UPDATE);
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
        const override = await fixture.createPermissionOverride({
            realm,
            permission,
            account,
            effect: PermissionOverrideEffect.DENY,
        });
        await fixture.setRevoked(override, !isRevoked);
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
        if (isRevoked) {
            await context.commands.override.revoke(props);
        } else {
            await context.commands.override.restore(props);
        }

        // Assert
        await helpers.expectSymmetry({
            context,
            executor: redis.executor(),
            redis: redis.client(),
            realm: realm.id,
            account,
            permissionRealm: realm.id,
            expected: isRevoked ? [permission.code] : [],
        });
    });
});
