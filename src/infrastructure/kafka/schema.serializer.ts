import { KafkaRequestSerializer } from "@nestjs/microservices/serializers";
import { isString } from "class-validator";

export class KafkaSchemaSerializer extends KafkaRequestSerializer {
    public constructor(private readonly schemaRegistry: Kafka.SchemaRegistry.Contract) {
        super();
    }

    public override async serialize(message: Kafka.Message, options?: Record<string, unknown>): Promise<Kafka.Request> {
        const topic = isString(options?.pattern) ? options.pattern : undefined;
        if (topic) {
            const encoded = await this.schemaRegistry.encode({ topic, value: message.value });
            return super.serialize(encoded === message.value ? message : { ...message, value: encoded });
        } else {
            return super.serialize(message);
        }
    }
}
