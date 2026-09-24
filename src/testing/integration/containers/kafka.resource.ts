import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { ConfigService } from "@nestjs/config";
import { Kafka, logLevel } from "kafkajs";

import { requiredEnvironment } from "./environment";

let container: Optional<StartedTestContainer>;

export class KafkaResource {
    public static async start(): Promise<void> {
        container = await new GenericContainer("apache/kafka:3.9.0")
            .withExposedPorts(9092)
            .withEntrypoint(["/bin/bash", "-c"])
            .withCommand([
                'echo "Waiting for test configuration"; ' +
                    "while [ ! -f /tmp/test-config-ready ]; do sleep 0.1; done; " +
                    "/opt/kafka/bin/kafka-storage.sh format -t MkU3OEVBNTcwNTJENDM2Qk -c /tmp/test-server.properties && " +
                    "exec /opt/kafka/bin/kafka-server-start.sh /tmp/test-server.properties",
            ])
            .withEnvironment({ KAFKA_HEAP_OPTS: "-Xms256m -Xmx512m" })
            .withWaitStrategy(Wait.forLogMessage("Waiting for test configuration"))
            .start();
        const broker = `${container.getHost()}:${container.getMappedPort(9092)}`;
        await container.copyContentToContainer([
            {
                target: "/tmp/test-server.properties",
                content: [
                    "node.id=1",
                    "process.roles=broker,controller",
                    "controller.quorum.voters=1@localhost:9093",
                    "controller.listener.names=CONTROLLER",
                    "listeners=PLAINTEXT://:9092,CONTROLLER://:9093",
                    `advertised.listeners=PLAINTEXT://${broker}`,
                    "listener.security.protocol.map=PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT",
                    "inter.broker.listener.name=PLAINTEXT",
                    "log.dirs=/tmp/kafka-test-data",
                    "num.partitions=1",
                    "auto.create.topics.enable=false",
                    "offsets.topic.replication.factor=1",
                    "transaction.state.log.replication.factor=1",
                    "transaction.state.log.min.isr=1",
                    "group.initial.rebalance.delay.ms=0",
                ].join("\n"),
            },
        ]);
        await container.exec(["touch", "/tmp/test-config-ready"]);
        const admin = new Kafka({
            brokers: [broker],
            logLevel: logLevel.NOTHING,
            connectionTimeout: 1000,
            retry: { retries: 12, initialRetryTime: 250, maxRetryTime: 2000 },
        }).admin();
        try {
            await admin.connect();
            await admin.listTopics();
            process.env.MONADIAM_TEST_KAFKA_BROKER = broker;
        } finally {
            await admin.disconnect();
        }
    }

    public static config(): ConfigService {
        return new ConfigService({
            SERVICE_NAME: "access-control-integration",
            KAFKA_BROKER: requiredEnvironment("MONADIAM_TEST_KAFKA_BROKER"),
            KAFKA_SSL_ENABLED: false,
            KAFKA_SASL_ENABLED: false,
            KAFKA_CONSUMER_RETRY_INITIAL_DELAY: "10ms",
            KAFKA_CONSUMER_RETRY_MAX_DELAY: "20ms",
            KAFKA_CONSUMER_MAX_RETRIES: 2,
        });
    }

    public static async stop(): Promise<void> {
        if (container) {
            await container.stop();
            container = undefined;
        }
    }
}
