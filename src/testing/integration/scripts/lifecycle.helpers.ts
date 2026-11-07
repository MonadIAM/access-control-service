import { expect } from "@jest/globals";
import Redis from "ioredis";

export class LifecycleProjectionHelpers implements Integration.Projection.Lifecycle.Contract {
    public constructor(private readonly redis: Redis) {}

    public async members(...parts: string[]): Integration.Projection.Lifecycle.Members.Result {
        return (await this.redis.smembers(["projection", ...parts].join(":"))).sort();
    }

    public async commandCalls(): Promise<Record<string, number>> {
        const info = await this.redis.info("commandstats");
        return Object.fromEntries(
            info
                .split("\r\n")
                .filter((line) => line.startsWith("cmdstat_"))
                .map((line) => {
                    const [name, statistics] = line.split(":");
                    const calls = statistics.split(",").find((item) => item.startsWith("calls="));
                    return [name.slice("cmdstat_".length), Number(calls?.slice("calls=".length) ?? 0)];
                }),
        );
    }

    public async expectMembership(
        scenario: Fixtures.Projection.Lifecycle.Scenario,
        active: boolean,
    ): Integration.Projection.Lifecycle.ExpectMembership.Result {
        const { realm, account } = scenario;
        expect(await this.redis.zscore(`projection:effective-realms:${account}`, realm)).toBe(active ? "inf" : null);
    }
}
