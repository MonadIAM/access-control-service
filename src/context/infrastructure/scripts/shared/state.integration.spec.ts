import { beforeEach, describe, expect, it } from "@jest/globals";

import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { redisSuite } from "~testing/integration/containers/redis.suite";

describe("[Projection] - shared/state", () => {
    const redis = redisSuite();
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it.each([
        { value: "realm:account", expected: ["realm", "account"] },
        { value: ":account", expected: [false, false] },
        { value: "realm:", expected: [false, false] },
        { value: "realm:account:extra", expected: [false, false] },
        { value: "realm", expected: [false, false] },
    ])("[case] - splits composite member $value without pattern matching", async ({ value, expected }) => {
        // Act
        const result = await fixture.probe({ action: "pair", value });

        // Assert
        expect(JSON.parse(result as string)).toEqual(expected);
    });

    it.each([null, false, "", 0, "0", "inf", "+inf"])("[case] - treats %s as no expiration", async (value) => {
        // Act
        const result = await fixture.probe({ action: "expiry", value });

        // Assert
        expect(result).toBe("+inf");
    });

    it("[case] - rejects invalid expiration", async () => {
        // Act
        const result = fixture.probe({ action: "expiry", value: -1 });

        // Assert
        await expect(result).rejects.toThrow("Invalid projection expiration");
    });

    it.each([
        { from: "now", untilTime: 0, expected: 1 },
        { from: 0, untilTime: "now", expected: 0 },
        { from: "invalid", untilTime: 0, expected: 0 },
        { from: 0, untilTime: "invalid", expected: 0 },
    ])("[case] - checks interval boundary $from:$untilTime", async ({ from, untilTime, expected }) => {
        // Act
        const result = await fixture.probe({ action: "available", from, untilTime });

        // Assert
        expect(result).toBe(expected);
    });
});
