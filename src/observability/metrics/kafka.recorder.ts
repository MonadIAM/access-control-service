import { getToken } from "@willsoto/nestjs-prometheus";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class KafkaMetricsRecorder implements Observability.Metrics.Kafka.Contract {
    public constructor(
        @Inject(getToken("kafka_consumer_errors_total"))
        public readonly consumerErrors: Observability.Metrics.Kafka.CounterMetric,
        @Inject(getToken("kafka_retry_messages_total"))
        public readonly retryMessages: Observability.Metrics.Kafka.CounterMetric,
        @Inject(getToken("kafka_dlq_messages_total"))
        public readonly deadMessages: Observability.Metrics.Kafka.CounterMetric,
    ) {}

    public recordRetry(
        props: Observability.Metrics.Kafka.RecordRetry.Props,
    ): Observability.Metrics.Kafka.RecordRetry.Result {
        const { topic, error } = props;
        this.consumerErrors.inc({ topic, disposition: "retry", error_type: this.resolveErrorType({ error }) });
        this.retryMessages.inc({ topic });
    }

    public recordDead(props: Observability.Metrics.Kafka.RecordDead.Props): Observability.Metrics.Kafka.RecordDead.Result {
        const { topic, error } = props;
        this.consumerErrors.inc({ topic, disposition: "dead", error_type: this.resolveErrorType({ error }) });
        this.deadMessages.inc({ topic });
    }

    public resolveErrorType(
        props: Observability.Metrics.Kafka.ResolveErrorType.Props,
    ): Observability.Metrics.Kafka.ResolveErrorType.Result {
        const { error } = props;
        return error instanceof Error ? error.constructor.name : typeof error;
    }
}
