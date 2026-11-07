import { describe, expect, it } from "@jest/globals";

import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { redisSuite } from "~testing/integration/containers/redis.suite";

describe("[Projection] - query wrapper", () => {
    const redis = redisSuite();

    it("[case] - exposes shared state to the query body", async () => {
        // Arrange
        const fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());

        // Act
        const result = await fixture.probe({ realm: "test" });

        // Assert
        expect(result).toBe("projection:realm:test");
    });
});
