import { Injectable } from "@nestjs/common";
import type RedisClient from "ioredis";

@Injectable()
export class RedisConnectionRegistry implements RedisConnection.Registry.Contract {
    protected readonly clients = new Map<RedisConnection.Kind, RedisClient>();

    protected readonly statuses: RedisConnection.Status[] = [
        "wait",
        "connecting",
        "connect",
        "ready",
        "reconnecting",
        "close",
        "end",
    ];

    public register(props: RedisConnection.Registry.Register.Props): RedisConnection.Registry.Register.Result {
        const { kind, client } = props;
        this.clients.set(kind, client);
    }

    public snapshots(): RedisConnection.Registry.Snapshots.Result {
        return Array.from(this.clients.entries()).map(([kind, client]) => ({
            connected: client.status === "connect" || client.status === "ready",
            ready: client.status === "ready",
            status: client.status,
            kind,
        }));
    }

    public statusValues(): RedisConnection.Registry.StatusValues.Result {
        return this.snapshots().flatMap((snapshot) =>
            this.statuses.map((status) => ({
                value: snapshot.status === status ? 1 : 0,
                kind: snapshot.kind,
                status,
            })),
        );
    }
}
