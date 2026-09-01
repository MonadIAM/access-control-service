import { Injectable } from "@nestjs/common";

@Injectable()
export class KafkaRetryRegistry implements Kafka.RetryRegistry.Contract {
    private readonly handlers = new Map<string, Kafka.RetryRegistry.Handler>();

    public register(props: Kafka.RetryRegistry.Register.Props): Kafka.RetryRegistry.Register.Result {
        const { topic, handler } = props;
        this.handlers.set(topic, handler);
    }

    public resolve(props: Kafka.RetryRegistry.Resolve.Props): Kafka.RetryRegistry.Resolve.Result {
        const { topic } = props;
        return this.handlers.get(topic);
    }
}
