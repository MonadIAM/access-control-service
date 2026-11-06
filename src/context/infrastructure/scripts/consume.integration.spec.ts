import { describe, expect, it } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { redisSuite } from "~testing/integration/containers/redis.suite";

describe("[Projection] - consume", () => {
    const redis = redisSuite();

    it("[case] - processes an event once and retains its inbox marker", async () => {
        // Arrange
        const template = await readFile(resolve("src/context/infrastructure/scripts/consume.lua"), "utf8");
        const body = await readFile(resolve("src/testing/integration/scripts/consume.lua"), "utf8");
        const source = template.replace("-- PROJECTION_SCRIPT", body);

        // Act
        const first = await redis.client().eval(source, 2, "test:counter", "projection:inbox:event", "60000");
        const repeated = await redis.client().eval(source, 2, "test:counter", "projection:inbox:event", "60000");

        // Assert
        expect(first).toEqual([1, 1]);
        expect(repeated).toEqual([0]);
        expect(await redis.client().get("test:counter")).toBe("1");
        expect(await redis.client().pttl("projection:inbox:event")).toBeGreaterThan(0);
    });

    it("[case] - leaves a failed event available for retry", async () => {
        // Arrange
        const template = await readFile(resolve("src/context/infrastructure/scripts/consume.lua"), "utf8");
        const body = await readFile(resolve("src/testing/integration/scripts/consume.lua"), "utf8");
        const source = template.replace("-- PROJECTION_SCRIPT", body);
        await redis.client().set("test:counter", "invalid");

        // Act
        const result = redis.client().eval(source, 2, "test:counter", "projection:inbox:event", "60000");

        // Assert
        await expect(result).rejects.toThrow("not an integer");
        expect(await redis.client().exists("projection:inbox:event")).toBe(0);
        expect(await redis.client().get("test:counter")).toBe("invalid");
    });
});
