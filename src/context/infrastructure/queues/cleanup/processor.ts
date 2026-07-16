import { Inject, Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

import { AUDIT_LOG_SERVICE, CHANGE_LOG_SERVICE } from "~context/domain/services/tokens";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CleanupJob } from "~context/enums";

import { CLEANUP_QUEUE } from "../tokens";
import { BullQueue } from "../enums";

@Injectable()
@Processor(BullQueue.CLEANUP)
export class CleanupProcessor extends WorkerHost {
    private readonly logger = new Logger(CleanupProcessor.name);

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(AUDIT_LOG_SERVICE)
        private readonly auditLogService: Services.AuditLog.Contract,
        @Inject(CHANGE_LOG_SERVICE)
        private readonly changeLogService: Services.ChangeLog.Contract,
        @Inject(CLEANUP_QUEUE)
        private readonly cleanupQueue: Queues.Cleanup.Contract,
    ) {
        super();
    }

    private readonly handlers: Record<CleanupJob, Queues.Cleanup.Handler> = {
        [CleanupJob.AUDIT_LOG]: (job: Job) => this.cleanupAuditLog(job),
        [CleanupJob.CHANGE_LOG]: (job: Job) => this.cleanupChangeLog(job),
    };

    public process(job: Job): Promise<Queues.Cleanup.Result> {
        return this.handlers[job.name as CleanupJob]?.(job);
    }

    private async cleanupAuditLog(job: Job<Queues.Cleanup.JobData>): Promise<Queues.Cleanup.Result> {
        const { olderThanMs, batchSize } = job.data;

        const expirationDate = new Date(Date.now() - olderThanMs);
        this.logger.log(`Cleaning up audit log entries older than ${expirationDate.toISOString()}`);

        try {
            const purged = await this.transactionalService.run({
                resource: "AuditLog",
                execute: (transaction) => this.auditLogService.purgeExpired({ transaction, expirationDate, batchSize }),
            });

            if (purged.length) {
                this.logger.log(`Deleted ${purged.length} audit log entries.`);
                return this.scheduleNextBatch(job, purged.length === batchSize);
            } else {
                this.logger.log("No audit log entries to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up audit log entries", error);
            throw error;
        }
    }

    private async cleanupChangeLog(job: Job<Queues.Cleanup.JobData>): Promise<Queues.Cleanup.Result> {
        const { olderThanMs, batchSize } = job.data;

        const expirationDate = new Date(Date.now() - olderThanMs);
        this.logger.log(`Cleaning up change log entries older than ${expirationDate.toISOString()}`);

        try {
            const purged = await this.transactionalService.run({
                resource: "ChangeLog",
                execute: (transaction) => this.changeLogService.purgeExpired({ transaction, expirationDate, batchSize }),
            });

            if (purged.length) {
                this.logger.log(`Deleted ${purged.length} change log entries.`);
                return this.scheduleNextBatch(job, purged.length === batchSize);
            } else {
                this.logger.log("No change log entries to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up change log entries", error);
            throw error;
        }
    }

    private async scheduleNextBatch(job: Job<Queues.Cleanup.JobData>, hasMore: boolean): Promise<Queues.Cleanup.Result> {
        if (hasMore) {
            await this.cleanupQueue.scheduleNextBatch(job.name as CleanupJob, job.data);
            this.logger.log("Next batch scheduled in 5 seconds...");
        }
        return { deleted: 0, nextBatch: hasMore };
    }
}
