import { KafkaJS } from "@confluentinc/kafka-javascript";
import { defer, Observable } from "rxjs";

import { KafkaTracing } from "./tracing";
import { KafkaSchemaSerializer } from "./schema.serializer";

export class KafkaClient {
    private readonly producer: KafkaJS.Producer;
    private connection?: Promise<void>;

    public constructor(
        config: KafkaJS.CommonConstructorConfig,
        private readonly serializer: KafkaSchemaSerializer,
    ) {
        this.producer = new KafkaJS.Kafka(config).producer({
            kafkaJS: { allowAutoTopicCreation: false, acks: -1 },
            partitioner: "murmur2_random",
        });
    }

    public connect(): Promise<void> {
        this.connection ??= this.producer.connect().catch((error: unknown) => {
            this.connection = undefined;
            throw error;
        });
        return this.connection;
    }

    public async close(): Promise<void> {
        if (this.connection) {
            try {
                await this.connection;
            } finally {
                await this.producer.disconnect();
                this.connection = undefined;
            }
        }
    }

    public emit(topic: string, message: Kafka.Message): Observable<KafkaJS.RecordMetadata[]> {
        return defer(() =>
            KafkaTracing.run(async () => {
                await this.connect();
                const encoded = await this.serializer.serialize(message, { pattern: topic });
                encoded.headers = KafkaTracing.inject(encoded.headers);
                return this.producer.send({ topic, messages: [encoded] });
            }),
        );
    }

    public async check(): Promise<void> {
        await this.connect();
        const admin = this.producer.dependentAdmin();
        try {
            await admin.connect();
            await admin.listTopics({ timeout: 5000 });
        } finally {
            await admin.disconnect();
        }
    }
}
