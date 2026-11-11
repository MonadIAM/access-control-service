import { SpanStatusCode, trace } from "@opentelemetry/api";

export function TraceStep(name: string) {
    return <Receiver, Args extends unknown[], Result>(
        _target: Receiver,
        _key: string | symbol,
        descriptor: TypedPropertyDescriptor<(this: Receiver, ...args: Args) => Promise<Result>>,
    ): void => {
        const original = descriptor.value;
        if (original) {
            descriptor.value = function (this: Receiver, ...args: Args): Promise<Result> {
                const parent = trace.getActiveSpan();
                if (parent && !parent.isRecording()) {
                    return original.apply(this, args);
                }

                return trace.getTracer("monadiam.steps").startActiveSpan(name, async (span) => {
                    try {
                        return await original.apply(this, args);
                    } catch (error) {
                        span.setStatus({ code: SpanStatusCode.ERROR });
                        throw error;
                    } finally {
                        span.end();
                    }
                });
            };
        }
    };
}
