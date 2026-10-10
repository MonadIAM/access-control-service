import { beforeEach, describe, expect, it } from "@jest/globals";
import Redis from "ioredis";

import { RedisConnectionRegistry } from "./connection.registry";

const statuses: RedisConnection.Status[] = ["wait", "connecting", "connect", "ready", "reconnecting", "close", "end"];

function client(status: RedisConnection.Status): Redis {
    return { status } as Redis;
}

describe("[InfrastructureService] - RedisConnectionRegistry", () => {
    let registry: RedisConnectionRegistry;

    beforeEach(() => {
        registry = new RedisConnectionRegistry();
    });

    describe("[Behavior] - connection state", () => {
        it("[case] - returns no snapshots or metric values before registration", () => {
            // Arrange

            // Act
            const result = registry.snapshots();
            const result2 = registry.statusValues();

            // Assert
            expect(result).toEqual([]);
            expect(result2).toEqual([]);
        });

        it.each(statuses)("[case] - maps status %s to connection flags and one-hot metric values", (status) => {
            // Arrange
            registry.register({ kind: "cache", client: client(status) });

            // Act
            const result = registry.snapshots();
            const result2 = registry.statusValues();

            // Assert
            expect(result).toEqual([
                {
                    kind: "cache",
                    status,
                    connected: status === "connect" || status === "ready",
                    ready: status === "ready",
                },
            ]);
            expect(result2).toEqual(
                statuses.map((candidate) => ({
                    kind: "cache",
                    status: candidate,
                    value: candidate === status ? 1 : 0,
                })),
            );
        });

        it("[case] - reads live client state independently for every connection kind", () => {
            // Arrange
            const cache = client("ready");
            registry.register({ kind: "cache", client: cache });
            registry.register({ kind: "limiter", client: client("connect") });
            registry.register({ kind: "queue", client: client("wait") });

            // Act
            const result = registry.snapshots();
            cache.status = "reconnecting";
            const values = registry.statusValues();

            const result1 = registry.snapshots()[0];

            // Assert
            expect(result).toEqual([
                { kind: "cache", status: "ready", connected: true, ready: true },
                { kind: "limiter", status: "connect", connected: true, ready: false },
                { kind: "queue", status: "wait", connected: false, ready: false },
            ]);
            expect(result1).toEqual({
                kind: "cache",
                status: "reconnecting",
                connected: false,
                ready: false,
            });
            expect(values).toHaveLength(21);
            expect(values.filter(({ value }) => value === 1)).toEqual([
                { kind: "cache", status: "reconnecting", value: 1 },
                { kind: "limiter", status: "connect", value: 1 },
                { kind: "queue", status: "wait", value: 1 },
            ]);
            expect(values).toContainEqual({ kind: "cache", status: "ready", value: 0 });
        });
    });

    describe("[Method] - register", () => {
        it("[case] - replaces a client registered under the same kind", () => {
            // Arrange
            registry.register({ kind: "cache", client: client("end") });

            // Act
            registry.register({ kind: "cache", client: client("ready") });

            const result = registry.snapshots();
            const result2 = registry.statusValues();

            // Assert
            expect(result).toEqual([{ kind: "cache", status: "ready", connected: true, ready: true }]);
            expect(result2).toHaveLength(7);
        });
    });
});
