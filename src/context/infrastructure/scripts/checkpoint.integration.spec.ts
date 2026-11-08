import { describe, expect, it } from "@jest/globals";

import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "./index";

describe("[Projection] - checkpoint", () => {
    const redis = redisSuite(ProjectionScript.CHECKPOINT);

    it.each([
        { previous: "0", incoming: "0", expected: "0" },
        { previous: "9", incoming: "10", expected: "10" },
        { previous: "10", incoming: "9", expected: "10" },
        { previous: "12", incoming: "11", expected: "12" },
        { previous: "12", incoming: "13", expected: "13" },
    ])("[case] - advances $previous with $incoming to $expected", async ({ previous, incoming, expected }) => {
        // Arrange
        await redis.client().hset("projection:revision:realm", "0", previous);

        // Act
        const result = await redis.executor().execute<string>({
            script: ProjectionScript.CHECKPOINT,
            args: [JSON.stringify({ realm: "realm" }), JSON.stringify({ partition: 0, offset: incoming })],
        });

        // Assert
        expect(result).toBe(incoming);
        expect(await redis.client().hget("projection:revision:realm", "0")).toBe(expected);
    });

    it("[case] - isolates realm checkpoints", async () => {
        // Arrange
        await redis.client().hset("projection:revision:other", "0", "99");

        // Act
        await redis.executor().execute<string>({
            script: ProjectionScript.CHECKPOINT,
            args: [JSON.stringify({ realm: "realm" }), JSON.stringify({ partition: 0, offset: "0" })],
        });

        // Assert
        expect(await redis.client().hgetall("projection:revision:realm")).toEqual({ "0": "0" });
        expect(await redis.client().hgetall("projection:revision:other")).toEqual({ "0": "99" });
    });

    it("[case] - leaves a failed checkpoint retryable without an inbox marker", async () => {
        // Arrange
        const key = "projection:revision:realm";
        await redis.client().set(key, "wrong-type");
        const props = {
            script: ProjectionScript.CHECKPOINT,
            event: "checkpoint-retry",
            args: [JSON.stringify({ realm: "realm" }), JSON.stringify({ partition: 0, offset: "12" })],
        };

        // Act
        const failed = redis.executor().consume<string>(props);

        // Assert
        await expect(failed).rejects.toThrow("WRONGTYPE");
        expect(await redis.client().exists("projection:inbox:checkpoint-retry")).toBe(0);
        await redis.client().del(key);
        expect(await redis.executor().consume<string>(props)).toEqual({ status: "processed", value: "12" });
        expect(await redis.client().hgetall(key)).toEqual({ "0": "12" });
        expect(await redis.client().pttl("projection:inbox:checkpoint-retry")).toBeGreaterThan(0);
    });

    it("[case] - keeps checkpoint offsets monotonic across duplicates and values above Number precision", async () => {
        // Arrange
        const realm = "checkpoint-realm";
        const key = `projection:revision:${realm}`;
        const offsets = ["9007199254740992", "9007199254740993", "9"];

        // Act
        for await (const offset of offsets) {
            await redis.executor().consume<string>({
                script: ProjectionScript.CHECKPOINT,
                event: `checkpoint:${offset}`,
                args: [JSON.stringify({ realm }), JSON.stringify({ partition: 0, offset })],
            });
        }
        const duplicate = await redis.executor().consume<string>({
            script: ProjectionScript.CHECKPOINT,
            event: "checkpoint:9007199254740993",
            args: [JSON.stringify({ realm }), JSON.stringify({ partition: 0, offset: "9007199254740993" })],
        });

        // Assert
        expect(await redis.client().hgetall(key)).toEqual({ "0": "9007199254740993" });
        expect(duplicate).toEqual({ status: "duplicate" });
    });

    it("[case] - retains independent checkpoint positions for each partition", async () => {
        // Arrange
        const realm = "checkpoint-realm";

        // Act
        for await (const partition of [0, 1]) {
            await redis.executor().consume<string>({
                script: ProjectionScript.CHECKPOINT,
                event: `checkpoint:${partition}`,
                args: [JSON.stringify({ realm }), JSON.stringify({ partition, offset: "12" })],
            });
        }

        // Assert
        expect(await redis.client().hgetall(`projection:revision:${realm}`)).toEqual({ "0": "12", "1": "12" });
    });
});
