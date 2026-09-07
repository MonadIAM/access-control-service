import { Injectable } from "@nestjs/common";
import type { Pool as PostgreSQLPool } from "pg";

@Injectable()
export class PostgreSQLPoolRegistry implements ORM.PoolRegistry.Contract {
    protected readonly pools = new Map<ORM.ConnectionKind, PostgreSQLPool>();

    public register(props: ORM.PoolRegistry.Register.Props): ORM.PoolRegistry.Register.Result {
        const { kind, pool } = props;
        this.pools.set(kind, pool);
    }

    public snapshot(props: ORM.PoolRegistry.Snapshot.Props): ORM.PoolRegistry.Snapshot.Result {
        const { kind } = props;
        const pool = this.pools.get(kind);

        if (pool) {
            const total = pool.totalCount;
            const idle = pool.idleCount;

            return {
                active: Math.max(total - idle, 0),
                waiting: pool.waitingCount,
                max: pool.options.max,
                total,
                kind,
                idle,
            };
        } else {
            return null;
        }
    }

    public snapshots(): ORM.PoolRegistry.Snapshots.Result {
        const snapshots: ORM.PoolRegistry.Snapshots.Result = [];

        for (const kind of this.pools.keys()) {
            const stats = this.snapshot({ kind });
            if (stats) {
                snapshots.push(stats);
            }
        }

        return snapshots;
    }
}
