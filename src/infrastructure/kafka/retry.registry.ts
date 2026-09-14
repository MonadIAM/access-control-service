import { Injectable } from "@nestjs/common";

@Injectable()
export class KafkaRetryRegistry implements Kafka.RetryRegistry.Contract {
    private readonly handlers = new Map<string, Kafka.RetryRegistry.Entry>();

    public register(props: Kafka.RetryRegistry.Register.Props): Kafka.RetryRegistry.Register.Result {
        const { topic, ...entry } = props;
        this.handlers.set(topic, entry);
    }

    public resolve(props: Kafka.RetryRegistry.Resolve.Props): Kafka.RetryRegistry.Resolve.Result {
        const { topic } = props;
        return this.handlers.get(topic);
    }
}
