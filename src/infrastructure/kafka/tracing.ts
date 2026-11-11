import { context, Context, propagation, ROOT_CONTEXT } from "@opentelemetry/api";
import { KafkaJS } from "@confluentinc/kafka-javascript";

export abstract class KafkaTracing {
    private constructor() {}

    public static inject(headers: KafkaJS.IHeaders = {}): KafkaJS.IHeaders {
        const carrier = { ...headers };
        propagation.inject(context.active(), carrier);
        return carrier;
    }

    public static extract(headers: KafkaJS.IHeaders = {}): Context {
        return propagation.extract(ROOT_CONTEXT, headers, {
            keys: (carrier) => Object.keys(carrier),
            get: (carrier, key) => {
                const value = carrier[key];
                if (Array.isArray(value)) {
                    const values: string[] = [];
                    for (const item of value) {
                        values.push(item.toString());
                    }
                    return values;
                }
                return value?.toString();
            },
        });
    }

    public static run<Result>(execute: () => Promise<Result>, parent: Context = context.active()): Promise<Result> {
        return context.with(parent, execute);
    }
}
