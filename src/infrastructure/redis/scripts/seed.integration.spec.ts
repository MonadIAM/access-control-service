import { beforeEach, describe, expect, it } from "@jest/globals";

import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { LifecycleProjectionHelpers } from "~testing/integration/scripts/lifecycle.helpers";
import { redisSuite } from "~testing/integration/containers/redis.suite";

describe("[Projection] - seed", () => {
    const redis = redisSuite();
    let fixture: LifecycleProjectionFixture;
    let helpers: LifecycleProjectionHelpers;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
        helpers = new LifecycleProjectionHelpers(redis.client());
    });

    it("[case] - restores hierarchy, inherited grants and assignment deadlines into an empty cache", async () => {
        // Arrange
        const scenario = await fixture.inheritedScenario();
        const { realm, role, parent, permission, account } = scenario;
        const deadline = Date.now() + 60000;
        fixture.data.accountRoleAssignments[0].expires_at = deadline;
        await redis.client().flushdb();

        // Act
        await fixture.seed(fixture.data);

        // Assert
        expect(await redis.client().hget(`projection:effective:REALM:${realm}:${account}:${realm}`, scenario.code)).toBe(
            `0:${deadline}`,
        );
        expect(await redis.client().zscore(`projection:effective-realms:${account}`, realm)).toBe(String(deadline));
        expect(await redis.client().zscore(`projection:role-ancestors:${realm}:${role}`, parent)).toBe("1");
        expect(await redis.client().zscore(`projection:role-descendants:${realm}:${parent}`, role)).toBe("1");
        expect(
            await redis.client().hget(`projection:account-role-assignment:${realm}:${account}:${role}`, "assignmentId"),
        ).toBe(scenario.assignment);
        expect(
            await redis
                .client()
                .hget(`projection:role-permission-assignments:${realm}:${parent}`, `${permission}:assignmentId`),
        ).toBe(scenario.grant);
    });

    it.each(["ALLOW", "DENY"])("[case] - seeds active %s override indexes without role membership", async (effect) => {
        // Act
        const scenario = await fixture.seedScenario({ redis: redis.client(), effect, isRevoked: false });

        // Assert
        expect(await redis.client().zscore(`projection:effective-realms:${scenario.account}`, scenario.realm)).toBeNull();
        expect(
            await redis
                .client()
                .hgetall(`projection:effective:REALM:${scenario.realm}:${scenario.account}:${scenario.permissionRealm}`),
        ).toEqual(effect === "ALLOW" ? { [scenario.code]: "0:0" } : {});
    });

    it("[case] - retains canonical revoked overrides without active rights", async () => {
        // Act
        const scenario = await fixture.seedScenario({ redis: redis.client(), effect: "ALLOW", isRevoked: true });

        // Assert
        expect(await helpers.members("permission-overrides", "by-account", scenario.realm, scenario.account)).toEqual([
            scenario.permission,
        ]);
        expect(
            await redis
                .client()
                .hlen(`projection:effective:REALM:${scenario.realm}:${scenario.account}:${scenario.permissionRealm}`),
        ).toBe(0);
    });
});
