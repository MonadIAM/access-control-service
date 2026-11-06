import { beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";
import { PermissionOverrideEffect } from "~context/enums";

import { ProjectionScript } from "../index";

describe("[Projection] - permission-override/create", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_OVERRIDE_CREATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - creates canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.overridePermission(scenario);
        fixture.data.permissionOverrides = fixture.data.permissionOverrides.filter((row) => row.id !== scenario.override);
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.PERMISSION_OVERRIDE_CREATE, { ...scenario, effect: "ALLOW" });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [scenario.code]: "0:0",
        });
        expect(
            await redis.client().hget(`projection:permission-override:${realm}:${account}:${permission}`, "isRevoked"),
        ).toBe("0");
    });
});

describe("[Projection] - permission-override/create event symmetry", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_OVERRIDE_CREATE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it("[case] - agrees with PostgreSQL after creation", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const { realm, child, permission, account } = await fixture.scenario();
        await fixture.createAccountRoleAssignment({ realm, role: child, account });
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const meta: Extract.Meta = { ip: "127.0.0.1", userAgent: "projection-create" };

        // Act
        await context.commands.override.create({
            realm: realm.id,
            actor: randomUUID(),
            context: meta,
            input: {
                account,
                permission: permission.id,
                effect: PermissionOverrideEffect.ALLOW,
                justification: "Projection",
            },
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

    it("[case] - materializes the future availability interval from a finite DENY event", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const { realm, permission, account } = await fixture.assigned();
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const expiresAt = new Date(Date.now() + 86400000);
        expiresAt.setHours(0, 0, 0, 0);

        // Act
        await context.commands.override.create({
            realm: realm.id,
            actor: randomUUID(),
            context: { ip: "127.0.0.1", userAgent: "projection-create" },
            input: {
                account,
                permission: permission.id,
                effect: PermissionOverrideEffect.DENY,
                expiresAt,
                justification: "Temporary restriction",
            },
        });

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
            await redis.client().hget(`projection:effective:REALM:${realm.id}:${account}:${realm.id}`, permission.code),
        ).toBe(`${expiresAt.getTime()}:0`);
    });
});
