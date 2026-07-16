import { Job } from "bullmq";

import { CleanupJob } from "~context/enums";

declare global {
    namespace Queues {
        namespace KafkaRetry {
            interface Contract {
                readonly maxRetryCount: number;
                schedule(message: Consumers.DLQ.Message, retryCount: number): Promise<void>;
            }

            type JobData = Consumers.DLQ.Message & { retryCount: number };
        }

        namespace Cleanup {
            interface Contract {
                scheduleNextBatch(job: CleanupJob, data: JobData): Promise<void>;
                schedule(job: CleanupJob, data: JobData): Promise<void>;
            }

            type JobData = {
                olderThanMs: number;
                batchSize: number;
            };

            type Result = {
                nextBatch: boolean;
                deleted: number;
            };

            type Handler = (job: Job) => Promise<Result>;
        }
    }
}
