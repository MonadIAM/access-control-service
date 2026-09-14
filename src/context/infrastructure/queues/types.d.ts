import { Job, JobType } from "bullmq";

import { CleanupJob } from "~context/enums";

declare global {
    namespace Queues {
        namespace Metrics {
            type JobState = Extract<
                JobType,
                "waiting" | "active" | "delayed" | "prioritized" | "waiting-children" | "failed" | "completed"
            >;

            type JobCounts = Partial<Record<JobState, number>>;
        }

        namespace KafkaRetry {
            type JobData = Consumers.Retry.Message & {
                event: string;
            };

            interface Contract {
                schedule: Schedule.Signature;
            }

            namespace Schedule {
                type Props = {
                    message: Consumers.Retry.Message;
                    event: string;
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

            type JobData = {
                expirationDate: number;
                batchSize: number;
                event: string;
                batch: number;
            };

            type RetentionJobData = JobData;
            type ExpirationJobData = JobData;

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
