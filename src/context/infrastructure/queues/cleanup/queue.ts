import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import ms, { StringValue } from "ms";
import { Queue } from "bullmq";

import { CleanupJob } from "~context/enums";

import { BullQueue } from "../enums";

@Injectable()
export class CleanupQueue implements Queues.Cleanup.Contract {
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

    public async schedule(job: CleanupJob, data: Queues.Cleanup.JobData): Promise<void> {
        await this.queue.add(job, data);
    }

    public async scheduleNextBatch(job: CleanupJob, data: Queues.Cleanup.JobData): Promise<void> {
        await this.queue.add(job, data, {
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
