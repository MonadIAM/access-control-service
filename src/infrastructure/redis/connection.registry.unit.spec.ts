import { beforeEach, describe, expect, it } from "@jest/globals";
import Redis from "ioredis";

import { RedisConnectionRegistry } from "./connection.registry";

const statuses: RedisConnection.Status[] = ["wait", "connecting", "connect", "ready", "reconnecting", "close", "end"];

function client(status: RedisConnection.Status): Redis {
    return { status } as Redis;
}

describe("RedisConnectionRegistry", () => {
    let registry: RedisConnectionRegistry;

    beforeEach(() => {
        registry = new RedisConnectionRegistry();
    });

    it("returns no snapshots or metric values before registration", () => {
        expect(registry.snapshots()).toEqual([]);
        expect(registry.statusValues()).toEqual([]);
    });

    it.each(statuses)("maps status %s to connection flags and one-hot metric values", (status) => {
        registry.register({ kind: "cache", client: client(status) });
        expect(registry.snapshots()).toEqual([
            {
                kind: "cache",
                status,
                connected: status === "connect" || status === "ready",
                ready: status === "ready",
            },
        ]);
        expect(registry.statusValues()).toEqual(
            statuses.map((candidate) => ({
                kind: "cache",
                status: candidate,
                value: candidate === status ? 1 : 0,
            })),
        );
    });

    it("reads live client state independently for every connection kind", () => {
        const cache = client("ready");
        registry.register({ kind: "cache", client: cache });
        registry.register({ kind: "limiter", client: client("connect") });
        registry.register({ kind: "queue", client: client("wait") });
        expect(registry.snapshots()).toEqual([
            { kind: "cache", status: "ready", connected: true, ready: true },
            { kind: "limiter", status: "connect", connected: true, ready: false },
            { kind: "queue", status: "wait", connected: false, ready: false },
        ]);
        cache.status = "reconnecting";
        expect(registry.snapshots()[0]).toEqual({
            kind: "cache",
            status: "reconnecting",
            connected: false,
            ready: false,
        });
        const values = registry.statusValues();
        expect(values).toHaveLength(21);
        expect(values.filter(({ value }) => value === 1)).toEqual([
            { kind: "cache", status: "reconnecting", value: 1 },
            { kind: "limiter", status: "connect", value: 1 },
            { kind: "queue", status: "wait", value: 1 },
        ]);
        expect(values).toContainEqual({ kind: "cache", status: "ready", value: 0 });
    });

    it("replaces a client registered under the same kind", () => {
        registry.register({ kind: "cache", client: client("end") });
        registry.register({ kind: "cache", client: client("ready") });
        expect(registry.snapshots()).toEqual([{ kind: "cache", status: "ready", connected: true, ready: true }]);
        expect(registry.statusValues()).toHaveLength(7);
    });
});
