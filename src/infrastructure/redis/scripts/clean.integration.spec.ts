import { describe, expect, it } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { redisSuite } from "~testing/integration/containers/redis.suite";

describe("[Projection] - clean", () => {
    const redis = redisSuite();

    it("[case] - clears projection keys across batches and preserves other namespaces", async () => {
        // Arrange
        const source = await readFile(resolve("src/infrastructure/redis/scripts/clean.lua"), "utf8");
        const pipeline = redis.client().pipeline();
        for (let index = 0; index < 1100; index += 1) {
            pipeline.set(`projection:test:${index}`, "1");
        }
        pipeline.set("other:keep", "1");
        await pipeline.exec();

        // Act
        const result = await redis.client().eval(source, 0);

        // Assert
        expect(result).toBe("OK");
        expect(await redis.client().keys("projection:*")).toEqual([]);
        expect(await redis.client().get("other:keep")).toBe("1");
    });
});
