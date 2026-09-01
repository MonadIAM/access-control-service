import { KafkaTopic } from "@monadiam/shared";

export abstract class KafkaTopicBuilder {
    private constructor() {}

    public static retry(topic: KafkaTopic): string {
        return `${topic}-retry-${process.env.SERVICE_NAME}`;
    }
}
