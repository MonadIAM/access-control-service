import { beforeEach, describe, expect, it } from "@jest/globals";
import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - permission/update", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_UPDATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it.each([true, false])("[case] - projects revocation state %s", async (isRevoked) => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.permissions.find((row) => row.id === scenario.permission)!.is_revoked = !isRevoked;
        await fixture.restore();

        const sibling = await fixture.siblingPermission(scenario);
        const before = await redis.client().hgetall(`projection:permissions:${realm}`);

        // Act
        await fixture.execute(ProjectionScript.PERMISSION_UPDATE, { realm, permissions: [permission], isRevoked });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [sibling.code]: "0:0",
            ...(isRevoked ? {} : { [scenario.code]: "0:0" }),
        });
        expect(await redis.client().hget(`projection:permissions:${realm}`, `${permission}:isRevoked`)).toBe(
            isRevoked ? "1" : "0",
        );

        expect(await redis.client().hgetall(`projection:permissions:${realm}`)).toEqual({
            ...before,
            [`${permission}:isRevoked`]: isRevoked ? "1" : "0",
        });
    });
});

describe("[Projection] - permission/update event symmetry", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_UPDATE);
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
        await fixture.setRevoked(state.permission, !isRevoked);
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
        if (isRevoked) {
            await context.commands.permission.revoke(props);
        } else {
            await context.commands.permission.restore(props);
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

    it.each([true, false])(
        "[case] - projects system permission revocation=%s across dependent realms",
        async (isRevoked) => {
            // Arrange
            const fixture = suite.fixtures();
            const { local, permission, account } = await fixture.globalScenario();
            await fixture.setRevoked(permission, !isRevoked);
            await fixture.snapshot(redis.client());
            const context = suite.repository();
            const props = {
                realm: SYSTEM_REALM_ID,
                actor: randomUUID(),
                context: { ip: "127.0.0.1", userAgent: "projection-global" },
                input: { identifiers: [permission.id], reason: "Projection symmetry" },
            };

            // Act
            if (isRevoked) {
                await context.commands.permission.revoke(props);
            } else {
                await context.commands.permission.restore(props);
            }

            // Assert
            await helpers.expectSymmetry({
                context,
                executor: redis.executor(),
                redis: redis.client(),
                realm: local.id,
                account,
                permissionRealm: SYSTEM_REALM_ID,
                expected: isRevoked ? [] : [permission.code],
                global: isRevoked ? [] : [permission.code],
            });
        },
    );
});
