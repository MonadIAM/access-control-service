import { Job } from "bullmq";

import { CleanupJob } from "~context/enums";

declare global {
    namespace Queues {
        namespace KafkaRetry {
            type JobData = Consumers.DLQ.Message;

            interface Contract {
                schedule: Schedule.Signature;
            }

            namespace Schedule {
                type Props = {
                    message: Consumers.DLQ.Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Cleanup {
            type Result = {
                nextBatch: boolean;
                deleted: number;
            };

            type Handler = (job: Job) => Promise<Result>;

            type RetentionJobData = {
                olderThanMs: number;
                batchSize: number;
            };

            type ExpirationJobData = {
                batchSize: number;
            };

            type JobData = RetentionJobData | ExpirationJobData;

            interface Contract {
                scheduleNextBatch: ScheduleNextBatch.Signature;
                schedule: Schedule.Signature;
            }

            namespace ScheduleNextBatch {
                type Props = {
                    job: CleanupJob;
                    data: JobData;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Schedule {
                type Props = {
                    job: CleanupJob;
                    data: JobData;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
