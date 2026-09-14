import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import ms, { StringValue } from "ms";
import { Queue } from "bullmq";

import { BullQueue } from "../enums";

@Injectable()
export class CleanupQueue implements Queues.Cleanup.Contract, OnModuleInit {
    private readonly batchBackoffDelay: number;
    private readonly batchAttempts: number;
    private readonly batchDelay: number;

    public constructor(
        @InjectQueue(BullQueue.CLEANUP)
        private readonly queue: Queue<Queues.Cleanup.JobData>,
        private readonly configService: ConfigService,
    ) {
        this.batchBackoffDelay = ms(this.configService.getOrThrow<StringValue>("CLEANUP_BATCH_BACKOFF_DELAY"));
        this.batchDelay = ms(this.configService.getOrThrow<StringValue>("CLEANUP_BATCH_DELAY"));
        this.batchAttempts = this.configService.getOrThrow<number>("CLEANUP_BATCH_ATTEMPTS");
    }

    public async onModuleInit(): Promise<void> {
        await this.queue.setGlobalConcurrency(1);
    }

    public async schedule(props: Queues.Cleanup.Schedule.Props): Queues.Cleanup.Schedule.Result {
        const { job, data } = props;
        await this.queue.add(job, data, {
            jobId: `${data.event}.${data.batch}`,
            attempts: this.batchAttempts,
            backoff: {
                delay: this.batchBackoffDelay,
                type: "exponential",
            },
        });
    }

    public async scheduleNextBatch(props: Queues.Cleanup.ScheduleNextBatch.Props): Queues.Cleanup.ScheduleNextBatch.Result {
        const { job, data } = props;
        const next = { ...data, batch: data.batch + 1 };
        await this.queue.add(job, next, {
            jobId: `${next.event}.${next.batch}`,
            attempts: this.batchAttempts,
            delay: this.batchDelay,
            backoff: {
                delay: this.batchBackoffDelay,
                type: "exponential",
            },
            removeOnComplete: true,
        });
    }
}
