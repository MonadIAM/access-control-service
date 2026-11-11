import { CustomTransportStrategy, Server, Transport } from "@nestjs/microservices";
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { KafkaParser } from "@nestjs/microservices/helpers";
import { isObservable, lastValueFrom } from "rxjs";
import { EventEmitter } from "node:events";

import { Exception } from "~common/exceptions";

import { KafkaTracing } from "./tracing";
import { KafkaContext } from "./context";

export class KafkaServer extends Server<Record<string, (...args: unknown[]) => void>> implements CustomTransportStrategy {
    public override readonly transportId = Transport.KAFKA;
    private readonly consumer: KafkaJS.Consumer;
    private readonly parser = new KafkaParser();
    private readonly events = new EventEmitter();
    private connected = false;

    public constructor(
        config: KafkaJS.CommonConstructorConfig,
        options: KafkaJS.ConsumerConfig,
        private readonly concurrency: number,
    ) {
        super();
        this.consumer = new KafkaJS.Kafka(config).consumer({
            kafkaJS: { allowAutoTopicCreation: false, autoCommit: true, fromBeginning: false, ...options },
        });
    }

    public override async listen(callback: (error?: unknown) => void): Promise<void> {
        try {
            await this.consumer.connect();
            const topics = [...this.messageHandlers.keys()];
            if (topics.length > 0) {
                await this.consumer.subscribe({ topics });
                await this.consumer.run({
                    partitionsConsumedConcurrently: this.concurrency,
                    eachMessage: (payload) => this.handleMessage(payload),
                });
            }
            this.connected = true;
            this._status$.next("connected");
            this.events.emit("connected");
            callback();
        } catch (error) {
            this.connected = false;
            try {
                await this.consumer.disconnect();
            } finally {
                callback(error);
            }
        }
    }

    public override async close(): Promise<void> {
        this.connected = false;
        await this.consumer.disconnect();
        this._status$.next("disconnected");
        this.events.emit("disconnected");
    }

    public override on(event: string, callback: (...args: unknown[]) => void): this {
        this.events.on(event, callback);
        return this;
    }

    public override unwrap(): never {
        throw Exception.methodNotAllowed({ messageKey: "services.kafka-transport.UNSUPPORTED_OPERATION" });
    }

    public isReady(): boolean {
        return this.connected;
    }

    public async handleMessage(payload: KafkaJS.EachMessagePayload): Promise<void> {
        const handler = this.getHandlerByPattern(payload.topic);
        if (!handler) {
            throw Exception.internal({ messageKey: "services.kafka-transport.HANDLER_MISSING" });
        }
        await KafkaTracing.run(async () => {
            const value: unknown = payload.message.value === null ? null : this.parser.decode(payload.message.value);
            const result: unknown = await handler(value, new KafkaContext([payload]));
            if (isObservable(result)) {
                await lastValueFrom(result, { defaultValue: undefined });
            }
        }, KafkaTracing.extract(payload.message.headers));
    }
}
