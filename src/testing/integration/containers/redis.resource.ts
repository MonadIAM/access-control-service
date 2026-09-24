import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { requiredEnvironment } from "./environment";

let container: Optional<StartedTestContainer>;
const password = "integration-redis-password";

export class RedisResource {
    public static async start(): Promise<void> {
        container = await new GenericContainer("redis:7.4.2-alpine3.21")
            .withExposedPorts(6379)
            .withCommand(["redis-server", "--requirepass", password, "--save", "", "--appendonly", "no"])
            .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
            .start();
        process.env.MONADIAM_TEST_REDIS_HOST = container.getHost();
        process.env.MONADIAM_TEST_REDIS_PORT = String(container.getMappedPort(6379));
        process.env.MONADIAM_TEST_REDIS_PASSWORD = password;
        const client = new Redis({
            host: container.getHost(),
            port: container.getMappedPort(6379),
            password,
            lazyConnect: true,
        });
        try {
            await client.connect();
            await client.ping();
        } finally {
            client.disconnect(false);
        }
    }

    public static config(): ConfigService {
        return new ConfigService({
            REDIS_HOST: requiredEnvironment("MONADIAM_TEST_REDIS_HOST"),
            REDIS_PORT: Number(requiredEnvironment("MONADIAM_TEST_REDIS_PORT")),
            REDIS_PASSWORD: requiredEnvironment("MONADIAM_TEST_REDIS_PASSWORD"),
            REDIS_DB_CACHE: 0,
            REDIS_DB_LIMITER: 1,
            REDIS_DB_QUEUE: 2,
            REDIS_TLS_ENABLED: false,
        });
    }

    public static async stop(): Promise<void> {
        if (container) {
            await container.stop();
            container = undefined;
        }
    }
}
