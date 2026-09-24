import { beforeEach, describe, expect, it } from "@jest/globals";
import { Pool } from "pg";

import { PostgreSQLPoolRegistry } from "./pool.registry";

describe("PostgreSQLPoolRegistry", () => {
    let registry: PostgreSQLPoolRegistry;

    beforeEach(() => {
        registry = new PostgreSQLPoolRegistry();
    });

    it("returns no snapshots before registration", () => {
        expect(registry.snapshot({ kind: "read" })).toBeNull();
        expect(registry.snapshots()).toEqual([]);
    });

    it("reads current pool counters and keeps read and write pools separate", () => {
        const pool = { totalCount: 8, idleCount: 3, waitingCount: 2, options: { max: 10 } } as Pool;
        registry.register({ kind: "read", pool });
        registry.register({ kind: "write", pool: new Pool({ max: 20 }) });
        expect(registry.snapshots()).toEqual([
            { kind: "read", total: 8, idle: 3, active: 5, waiting: 2, max: 10 },
            { kind: "write", total: 0, idle: 0, active: 0, waiting: 0, max: 20 },
        ]);
        Object.assign(pool, { totalCount: 2, idleCount: 4, waitingCount: 0 });
        expect(registry.snapshot({ kind: "read" })).toEqual({
            kind: "read",
            total: 2,
            idle: 4,
            active: 0,
            waiting: 0,
            max: 10,
        });
    });

    it("replaces a registered pool without adding duplicate snapshots", () => {
        registry.register({ kind: "write", pool: new Pool({ max: 5 }) });
        registry.register({ kind: "write", pool: new Pool({ max: 15 }) });
        expect(registry.snapshots()).toEqual([{ kind: "write", total: 0, idle: 0, active: 0, waiting: 0, max: 15 }]);
    });
});
