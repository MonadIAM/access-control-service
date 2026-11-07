import { describe, expect, it } from "@jest/globals";

import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { redisSuite } from "~testing/integration/containers/redis.suite";

describe("[Projection] - mutation wrapper", () => {
    const redis = redisSuite();

    it("[case] - rebuilds rights after applying the mutation body", async () => {
        // Arrange
        const fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
        const scenario = await fixture.createScenario();
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);

        // Act
        const result = await fixture.probe({ ...scenario, action: "revoke" }, "role/update");

        // Assert
        expect(result).toBe("OK");
        expect(
            await redis
                .client()
                .hlen(`projection:effective:REALM:${scenario.realm}:${scenario.account}:${scenario.permissionRealm}`),
        ).toBe(0);
    });
});
