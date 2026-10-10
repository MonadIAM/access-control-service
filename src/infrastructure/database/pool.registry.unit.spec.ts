import { beforeEach, describe, expect, it } from "@jest/globals";
import { Pool } from "pg";

import { PostgreSQLPoolRegistry } from "./pool.registry";

describe("[InfrastructureService] - PostgreSQLPoolRegistry", () => {
    let registry: PostgreSQLPoolRegistry;

    beforeEach(() => {
        registry = new PostgreSQLPoolRegistry();
    });

    describe("[Behavior] - pool snapshots", () => {
        it("[case] - returns no snapshots before registration", () => {
            // Arrange

            // Act
            const result = registry.snapshot({ kind: "read" });
            const result2 = registry.snapshots();

            // Assert
            expect(result).toBeNull();
            expect(result2).toEqual([]);
        });

        it("[case] - reads current pool counters and keeps read and write pools separate", () => {
            // Arrange
            const pool = { totalCount: 8, idleCount: 3, waitingCount: 2, options: { max: 10 } } as Pool;
            registry.register({ kind: "read", pool });
            registry.register({ kind: "write", pool: new Pool({ max: 20 }) });

            // Act
            const result = registry.snapshots();
            Object.assign(pool, { totalCount: 2, idleCount: 4, waitingCount: 0 });
            const result2 = registry.snapshot({ kind: "read" });

            // Assert
            expect(result).toEqual([
                { kind: "read", total: 8, idle: 3, active: 5, waiting: 2, max: 10 },
                { kind: "write", total: 0, idle: 0, active: 0, waiting: 0, max: 20 },
            ]);
            expect(result2).toEqual({
                kind: "read",
                total: 2,
                idle: 4,
                active: 0,
                waiting: 0,
                max: 10,
            });
        });
    });

    describe("[Method] - register", () => {
        it("[case] - replaces a registered pool without adding duplicate snapshots", () => {
            // Arrange
            registry.register({ kind: "write", pool: new Pool({ max: 5 }) });

            // Act
            registry.register({ kind: "write", pool: new Pool({ max: 15 }) });

            const result = registry.snapshots();

            // Assert
            expect(result).toEqual([{ kind: "write", total: 0, idle: 0, active: 0, waiting: 0, max: 15 }]);
        });
    });
});
