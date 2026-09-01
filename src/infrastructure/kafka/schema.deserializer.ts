import { Deserializer, IncomingEvent, IncomingRequest } from "@nestjs/microservices";
import { KafkaRequestDeserializer } from "@nestjs/microservices/deserializers";
import { isString } from "class-validator";

export class KafkaSchemaDeserializer implements Deserializer<Kafka.Request, Promise<IncomingEvent | IncomingRequest>> {
    private readonly deserializer = new KafkaRequestDeserializer();

    public constructor(private readonly schemaRegistry: Kafka.SchemaRegistry.Contract) {}

    public async deserialize(
        message: Kafka.Request,
        options?: Record<string, unknown>,
    ): Promise<IncomingEvent | IncomingRequest> {
        const topic = isString(options?.channel) ? options.channel : undefined;
        const value = topic ? await this.schemaRegistry.decode({ topic, value: message.value }) : message.value;
        return this.deserializer.deserialize({ ...message, value }, options);
    }
}
