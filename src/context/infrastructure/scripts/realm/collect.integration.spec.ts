import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - realm/collect", () => {
    const redis = redisSuite(ProjectionScript.REALM_COLLECT);

    it.each(["active", "expired", "missing"])("[case] - reads %s membership", async (state) => {
        // Arrange
        const realm = randomUUID();
        const account = randomUUID();
        if (state !== "missing") {
            await redis
                .client()
                .zadd(`projection:effective-realms:${account}`, state === "active" ? "+inf" : Date.now() - 1000, realm);
        }
        await redis.client().sadd(`projection:account-realms:${account}`, realm);

        // Act
        const result = JSON.parse(
            await redis.executor().execute<string>({
                script: ProjectionScript.REALM_COLLECT,
                args: [JSON.stringify({ realm, account })],
            }),
        );

        // Assert
        expect(result).toEqual(state === "active" ? [realm] : []);
    });
});
