import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { KafkaRetriableException } from "@nestjs/microservices";
import { setTimeout } from "node:timers/promises";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { KAFKA_METRICS_RECORDER } from "~observability/metrics/tokens";
import { Exception } from "~common/exceptions";

@Injectable()
export class KafkaRetryService implements Kafka.Retry.Contract, OnModuleDestroy {
    private readonly HEARTBEAT_POLL_INTERVAL = 1e3;
    private readonly shutdown = new AbortController();
    private readonly initialDelay: number;
    private readonly maxRetries: number;
    private readonly maxDelay: number;

    public constructor(
        @Inject(KAFKA_METRICS_RECORDER)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
        configService: ConfigService,
    ) {
        this.initialDelay = ms(configService.getOrThrow<StringValue>("KAFKA_CONSUMER_RETRY_INITIAL_DELAY"));
        this.maxDelay = ms(configService.getOrThrow<StringValue>("KAFKA_CONSUMER_RETRY_MAX_DELAY"));
        this.maxRetries = configService.getOrThrow<number>("KAFKA_CONSUMER_MAX_RETRIES");
    }

    public onModuleDestroy(): void {
        this.shutdown.abort();
    }

    public async execute(props: Kafka.Retry.Execute.Props): Kafka.Retry.Execute.Result {
        try {
            await this.retry({ ...props, attempt: 0 });
            this.shutdown.signal.throwIfAborted();
        } catch (error) {
            throw new KafkaRetriableException(error instanceof Error ? error : String(error));
        }
    }

    public async retry(props: Kafka.Retry.Retry.Props): Kafka.Retry.Retry.Result {
        this.shutdown.signal.throwIfAborted();
        await props.heartbeat();

        try {
            await props.process();
        } catch (error) {
            this.shutdown.signal.throwIfAborted();
            if (error instanceof KafkaRetriableException) {
                throw error;
            } else if (Exception.isRetryable(error) && props.attempt < this.maxRetries) {
                const attempt = props.attempt + 1;
                this.kafkaMetrics.recordRetry({ topic: props.topic, error });
                await this.wait({ heartbeat: props.heartbeat, deadline: Date.now() + this.backoff({ attempt }) });
                await this.retry({ ...props, attempt });
            } else {
                await props.reject(error);
            }
        }
    }

    public async wait(props: Kafka.Retry.Wait.Props): Kafka.Retry.Wait.Result {
        this.shutdown.signal.throwIfAborted();
        const remaining = props.deadline - Date.now();

        if (remaining > 0) {
            await setTimeout(Math.min(this.HEARTBEAT_POLL_INTERVAL, remaining), undefined, {
                signal: this.shutdown.signal,
            });
            await props.heartbeat();
            await this.wait(props);
        }
    }

    public backoff(props: Kafka.Retry.Backoff.Props): Kafka.Retry.Backoff.Result {
        const ceiling = Math.min(this.initialDelay * Math.pow(2, props.attempt - 1), this.maxDelay);
        return Math.random() * ceiling;
    }
}
