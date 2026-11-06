import { beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - realm/update", () => {
    const redis = redisSuite(ProjectionScript.REALM_UPDATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it.each([true, false])("[case] - projects revocation state %s", async (isRevoked) => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.realms.find((row) => row.id === scenario.realm)!.is_revoked = !isRevoked;
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.REALM_UPDATE, { realm, isRevoked });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual(
            isRevoked ? {} : { [scenario.code]: "0:0" },
        );
        expect(await redis.client().hget(`projection:realm:${realm}`, "isRevoked")).toBe(isRevoked ? "1" : "0");
    });
});

describe("[Projection] - realm/update event symmetry", () => {
    const redis = redisSuite(ProjectionScript.REALM_UPDATE);
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
        await fixture.setRevoked(state.realm, !isRevoked);
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const props = {
            realm: realm.id,
            actor: randomUUID(),
            context: { ip: "127.0.0.1", userAgent: "projection-symmetry" },
            global: true,
            input: { identifiers: [state.realm.id], reason: "Projection symmetry" },
        };

        // Act
        if (isRevoked) {
            await context.commands.realm.revoke(props);
        } else {
            await context.commands.realm.restore(props);
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
