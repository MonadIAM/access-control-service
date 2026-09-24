import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

import { requiredEnvironment } from "./environment";

let container: Optional<StartedTestContainer>;

export class SchemaRegistryResource {
    public static async start(): Promise<void> {
        container = await new GenericContainer("apicurio/apicurio-registry:3.3.2")
            .withExposedPorts(8080)
            .withWaitStrategy(Wait.forHttp("/apis/ccompat/v7/subjects", 8080).forStatusCode(200))
            .withStartupTimeout(120_000)
            .start();
        process.env.MONADIAM_TEST_SCHEMA_REGISTRY_URL = `http://${container.getHost()}:${container.getMappedPort(8080)}/apis/ccompat/v7`;
    }

    public static url(): string {
        return requiredEnvironment("MONADIAM_TEST_SCHEMA_REGISTRY_URL");
    }

    public static async stop(): Promise<void> {
        if (container) {
            await container.stop();
            container = undefined;
        }
    }
}
