import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "@jest/globals";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - permission/purge", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_PURGE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - purges canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        await fixture.restore();

        const sibling = await fixture.siblingPermission(scenario);
        const before = await redis.client().hgetall(`projection:permissions:${realm}`);

        // Act
        await fixture.execute(ProjectionScript.PERMISSION_PURGE, { realm, permissions: [permission] });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [sibling.code]: "0:0",
        });
        expect(await redis.client().hexists(`projection:permissions:${realm}`, `${permission}:code`)).toBe(0);

        expect(await redis.client().hgetall(`projection:permissions:${realm}`)).toEqual(
            Object.fromEntries(Object.entries(before).filter(([field]) => !field.startsWith(`${permission}:`))),
        );
    });
    it.each([0, 1, 65])("[case] - purges %s override references without touching another permission", async (count) => {
        // Arrange
        const scenario = await fixture.createScenario();
        const sibling = await fixture.siblingPermission(scenario);
        await fixture.overrideAccounts(scenario, count);

        // Act
        await fixture.execute(ProjectionScript.PERMISSION_PURGE, {
            realm: scenario.realm,
            permissions: [scenario.permission],
        });

        // Assert
        expect(await redis.client().hgetall(`projection:permissions:${scenario.realm}`)).toEqual({
            [`${sibling.permission}:isRevoked`]: "0",
            [`${sibling.permission}:code`]: sibling.code,
        });
        expect(
            await redis.client().exists(`projection:permission-usages:overrides:${scenario.realm}:${scenario.permission}`),
        ).toBe(0);
        for await (const override of fixture.data.permissionOverrides) {
            expect(
                await redis
                    .client()
                    .exists(`projection:permission-override:${scenario.realm}:${override.account}:${scenario.permission}`),
            ).toBe(0);
            expect(
                await redis
                    .client()
                    .smembers(`projection:permission-overrides:by-account:${scenario.realm}:${override.account}`),
            ).toEqual([]);
            expect(
                await redis
                    .client()
                    .hgetall(`projection:effective:REALM:${scenario.realm}:${override.account}:${scenario.realm}`),
            ).toEqual({});
        }
    });
});

describe("[Projection] - permission/purge event symmetry", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_PURGE);
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
        await fixture.setRevoked(state.permission, true);
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const props = {
            realm: realm.id,
            actor: randomUUID(),
            context: { ip: "127.0.0.1", userAgent: "projection-symmetry" },
            global: true,
            input: { identifiers: [state.permission.id], reason: "Projection symmetry" },
        };

        // Act
        await context.commands.permission.purge(props);

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
        expect(await redis.client().hexists(`projection:permissions:${realm.id}`, `${permission.id}:code`)).toBe(0);
    });
});
