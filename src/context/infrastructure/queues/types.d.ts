declare namespace Queues {
    namespace KafkaRetry {
        interface Contract {
            readonly maxRetryCount: number;
            schedule: (message: Consumers.DLQ.Message, retryCount: number) => Promise<void>;
        }

        type JobData = Consumers.DLQ.Message & { retryCount: number };
    }
}
